import AVKit
import UIKit
import NitroModules

class HybridOrcaVideoPlayerView: HybridOrcaVideoPlayerViewSpec {
  var source: VideoSource = VideoSource(uri: "")
  var autoplay: Bool = false
  var muted: Bool = false
  var controls: Bool = false
  var resizeMode: ResizeMode = .contain
  var preload: Bool = false
  var onProgress: (Double) -> Void = { _ in }
  var onEnd: () -> Void = {}

  private let containerView = UIView()
  private let playerViewController = AVPlayerViewController()
  private var player: AVPlayer?
  private var timeObserver: Any?
  private var endObserver: NSObjectProtocol?
  private var statusObserver: NSKeyValueObservation?
  private var hasRequestedPreload = false
  private var loadedUri: String = ""

  var view: UIView {
    containerView
  }

  override init() {
    super.init()
    containerView.backgroundColor = .black
    playerViewController.view.frame = containerView.bounds
    playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    playerViewController.showsPlaybackControls = false
    containerView.addSubview(playerViewController.view)
  }

  func beforeUpdate() {}

  func afterUpdate() {
    applySourceIfNeeded()
    player?.isMuted = muted
    playerViewController.showsPlaybackControls = controls
    playerViewController.videoGravity = videoGravity(for: resizeMode)

    if autoplay {
      player?.play()
    }
  }

  func onDropView() {
    cleanup()
  }

  func play() throws {
    player?.play()
  }

  func pause() throws {
    player?.pause()
  }

  func seekTo(seconds: Double) throws {
    let time = CMTime(seconds: seconds, preferredTimescale: 600)
    player?.seek(to: time)
  }

  private func applySourceIfNeeded() {
    let uri = source.uri
    guard !uri.isEmpty, uri != loadedUri else {
      return
    }

    cleanupObservers()
    loadedUri = uri
    hasRequestedPreload = false

    guard let url = URL(string: uri) else {
      return
    }

    let item = AVPlayerItem(url: url)
    let newPlayer = AVPlayer(playerItem: item)
    newPlayer.automaticallyWaitsToMinimizeStalling = true
    player = newPlayer
    playerViewController.player = newPlayer
    newPlayer.isMuted = muted

    setupObservers(for: newPlayer, item: item)

    if preload && !autoplay {
      configurePreload(for: item, player: newPlayer)
    }
  }

  private func configurePreload(for item: AVPlayerItem, player: AVPlayer) {
    item.preferredForwardBufferDuration = 10

    item.asset.loadValuesAsynchronously(forKeys: ["playable"]) { [weak self] in
      DispatchQueue.main.async {
        guard let self, self.player === player else {
          return
        }
        self.beginPreloadIfReady(player: player, item: item)
      }
    }

    statusObserver = item.observe(\.status, options: [.new]) { [weak self] item, _ in
      guard let self, self.player === player else {
        return
      }
      if item.status == .readyToPlay {
        self.beginPreloadIfReady(player: player, item: item)
      }
    }
  }

  private func beginPreloadIfReady(player: AVPlayer, item: AVPlayerItem) {
    guard preload, !autoplay, !hasRequestedPreload else {
      return
    }
    guard item.status == .readyToPlay, player.rate == 0, player.error == nil else {
      return
    }

    hasRequestedPreload = true
    statusObserver?.invalidate()
    statusObserver = nil
    player.preroll(atRate: 1.0) { _ in }
  }

  private func setupObservers(for player: AVPlayer, item: AVPlayerItem) {
    let interval = CMTime(seconds: 0.25, preferredTimescale: 600)
    timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) {
      [weak self] time in
      guard let self else {
        return
      }
      let seconds = CMTimeGetSeconds(time)
      if seconds.isFinite {
        self.onProgress(seconds)
      }
    }

    endObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: item,
      queue: .main
    ) { [weak self] _ in
      self?.onEnd()
    }
  }

  private func cleanupObservers() {
    statusObserver?.invalidate()
    statusObserver = nil

    if let timeObserver, let player {
      player.removeTimeObserver(timeObserver)
    }
    timeObserver = nil

    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }
    endObserver = nil
  }

  private func cleanup() {
    cleanupObservers()
    player?.pause()
    player?.replaceCurrentItem(with: nil)
    playerViewController.player = nil
    player = nil
    loadedUri = ""
    hasRequestedPreload = false
  }

  private func videoGravity(for mode: ResizeMode) -> AVLayerVideoGravity {
    switch mode {
    case .cover:
      return .resizeAspectFill
    case .contain:
      return .resizeAspect
    case .stretch:
      return .resize
    @unknown default:
      return .resizeAspect
    }
  }
}
