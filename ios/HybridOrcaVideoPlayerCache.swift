import CryptoKit
import Foundation
import NitroModules

class HybridOrcaVideoPlayerCache: HybridOrcaVideoPlayerCacheSpec {
  private let cacheDirectory: URL
  private let downloadSession: URLSession
  private var activeDownloads: [String: URLSessionDownloadTask] = [:]
  private let queue = DispatchQueue(label: "com.orcavideoplayer.cache")

  override init() {
    let baseDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    cacheDirectory = baseDirectory.appendingPathComponent("orca-video-cache", isDirectory: true)
    try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)

    let configuration = URLSessionConfiguration.default
    downloadSession = URLSession(configuration: configuration)
    super.init()
  }

  func preload(source: VideoSource) throws -> Promise<Void> {
    let uri = source.uri
    return Promise.async {
      if self.fileIsCached(uri: uri) {
        return
      }

      if self.activeDownloads[uri] != nil {
        return
      }

      guard let remoteURL = URL(string: uri) else {
        throw NSError(
          domain: "OrcaVideoPlayerCache",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Invalid video URI: \(uri)"]
        )
      }

      try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
        self.queue.async {
          let destinationURL = self.cacheFileURL(for: uri)
          let task = self.downloadSession.downloadTask(with: remoteURL) { tempURL, _, error in
            self.queue.async {
              self.activeDownloads[uri] = nil

              if let error {
                continuation.resume(throwing: error)
                return
              }

              guard let tempURL else {
                continuation.resume(
                  throwing: NSError(
                    domain: "OrcaVideoPlayerCache",
                    code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "Download failed for: \(uri)"]
                  )
                )
                return
              }

              do {
                if FileManager.default.fileExists(atPath: destinationURL.path) {
                  try FileManager.default.removeItem(at: destinationURL)
                }
                try FileManager.default.moveItem(at: tempURL, to: destinationURL)
                continuation.resume()
              } catch {
                continuation.resume(throwing: error)
              }
            }
          }

          self.activeDownloads[uri] = task
          task.resume()
        }
      }
    }
  }

  func isCached(uri: String) throws -> Bool {
    fileIsCached(uri: uri)
  }

  private func fileIsCached(uri: String) -> Bool {
    FileManager.default.fileExists(atPath: cacheFileURL(for: uri).path)
  }

  func getCachedUri(uri: String) throws -> Variant_NullType_String {
    let fileURL = cacheFileURL(for: uri)
    guard FileManager.default.fileExists(atPath: fileURL.path) else {
      return .first(NullType.null)
    }
    return .second(fileURL.absoluteString)
  }

  func clearCache(uri: String) throws -> Promise<Void> {
    return Promise.async {
      let fileURL = self.cacheFileURL(for: uri)
      if FileManager.default.fileExists(atPath: fileURL.path) {
        try FileManager.default.removeItem(at: fileURL)
      }
    }
  }

  func clearAllCache() throws -> Promise<Void> {
    return Promise.async {
      if FileManager.default.fileExists(atPath: self.cacheDirectory.path) {
        try FileManager.default.removeItem(at: self.cacheDirectory)
      }
      try FileManager.default.createDirectory(
        at: self.cacheDirectory,
        withIntermediateDirectories: true
      )
    }
  }

  private func cacheFileURL(for uri: String) -> URL {
    let hash = SHA256.hash(data: Data(uri.utf8))
    let filename = hash.map { String(format: "%02x", $0) }.joined() + ".mp4"
    return cacheDirectory.appendingPathComponent(filename)
  }
}
