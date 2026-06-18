import AVFoundation
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
  var loop: Bool = false
  var allowsPictureInPicture: Bool = false
  var autoEnterPictureInPicture: Bool = false
  var onProgress: (Double) -> Void = { _ in }
  var onEnd: () -> Void = {}
  var onPictureInPictureChange: (Bool) -> Void = { _ in }

  private let containerView = UIView()
  private let playerViewController = AVPlayerViewController()
  private var player: AVPlayer?
  private var playerLooper: AVPlayerLooper?
  private var pipController: AVPictureInPictureController?
  private var pipDelegate: PictureInPictureDelegate?
  private var pipPossibleObservation: NSKeyValueObservation?
  private var pipBoundPlayerLayer: AVPlayerLayer?
  private var pipSetupRetryCount = 0
  private var timeObserver: Any?
  private var endObserver: NSObjectProtocol?
  private var statusObserver: NSKeyValueObservation?
  private var hasRequestedPreload = false
  private var loadedUri: String = ""

  private let maxPipSetupRetries = 10

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
    applyLoopModeIfNeeded()
    applyPictureInPictureSettings()
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

  func enterPictureInPicture() throws {
    guard allowsPictureInPicture else {
      return
    }

    configureAudioSessionIfNeeded()
    pipSetupRetryCount = 0
    setupPictureInPictureControllerIfNeeded()
    startPictureInPictureWhenReady(retryCount: 5)
  }

  func exitPictureInPicture() throws {
    if pipController?.isPictureInPictureActive == true {
      pipController?.stopPictureInPicture()
    }
  }

  private func startPictureInPictureWhenReady(retryCount: Int) {
    guard retryCount > 0 else {
      return
    }

    if pipController == nil {
      pipSetupRetryCount = 0
      setupPictureInPictureControllerIfNeeded()
    }

    guard let pipController else {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
        self?.startPictureInPictureWhenReady(retryCount: retryCount - 1)
      }
      return
    }

    if pipController.isPictureInPictureActive {
      return
    }

    if pipController.isPictureInPicturePossible {
      pipController.startPictureInPicture()
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
      guard let self else {
        return
      }
      self.pipSetupRetryCount = 0
      self.setupPictureInPictureControllerIfNeeded()
      self.startPictureInPictureWhenReady(retryCount: retryCount - 1)
    }
  }

  private func applyPictureInPictureSettings() {
    playerViewController.allowsPictureInPicturePlayback = allowsPictureInPicture
    if #available(iOS 14.2, *) {
      playerViewController.canStartPictureInPictureAutomaticallyFromInline =
        allowsPictureInPicture && autoEnterPictureInPicture
    }

    if allowsPictureInPicture, player != nil {
      configureAudioSessionIfNeeded()
      pipSetupRetryCount = 0
      setupPictureInPictureControllerIfNeeded()
    } else {
      teardownPictureInPictureController()
    }
  }

  private func configureAudioSessionIfNeeded() {
    guard allowsPictureInPicture else {
      return
    }

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .moviePlayback)
      try session.setActive(true)
    } catch {
      // PiP may still work without an active session, but playback backgrounding needs this.
    }
  }

  private func setupPictureInPictureControllerIfNeeded() {
    guard allowsPictureInPicture, player != nil else {
      return
    }

    guard AVPictureInPictureController.isPictureInPictureSupported() else {
      return
    }

    guard let playerLayer = resolvePlayerLayer() else {
      guard pipSetupRetryCount < maxPipSetupRetries else {
        return
      }
      pipSetupRetryCount += 1
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
        self?.setupPictureInPictureControllerIfNeeded()
      }
      return
    }

    if pipController != nil, pipBoundPlayerLayer === playerLayer {
      return
    }

    teardownPictureInPictureController()

    let delegate = PictureInPictureDelegate { [weak self] active in
      self?.onPictureInPictureChange(active)
    }
    pipDelegate = delegate

    let controller: AVPictureInPictureController?
    if #available(iOS 15.0, *) {
      let contentSource = AVPictureInPictureController.ContentSource(playerLayer: playerLayer)
      controller = AVPictureInPictureController(contentSource: contentSource)
    } else {
      controller = AVPictureInPictureController(playerLayer: playerLayer)
    }

    controller?.delegate = delegate
    pipController = controller
    pipBoundPlayerLayer = playerLayer
    pipSetupRetryCount = 0

    pipPossibleObservation = controller?.observe(
      \.isPictureInPicturePossible,
      options: [.initial, .new]
    ) { _, _ in }
  }

  private func resolvePlayerLayer() -> AVPlayerLayer? {
    playerViewController.view.layoutIfNeeded()
    return findPlayerLayer(in: playerViewController.view.layer)
  }

  private func teardownPictureInPictureController() {
    pipPossibleObservation?.invalidate()
    pipPossibleObservation = nil
    pipController?.delegate = nil
    pipDelegate = nil
    pipBoundPlayerLayer = nil
    if pipController?.isPictureInPictureActive == true {
      pipController?.stopPictureInPicture()
    }
    pipController = nil
  }

  private func findPlayerLayer(in layer: CALayer) -> AVPlayerLayer? {
    if let playerLayer = layer as? AVPlayerLayer {
      return playerLayer
    }

    for sublayer in layer.sublayers ?? [] {
      if let playerLayer = findPlayerLayer(in: sublayer) {
        return playerLayer
      }
    }

    return nil
  }

  private func applySourceIfNeeded() {
    let uri = source.uri
    guard !uri.isEmpty, uri != loadedUri else {
      return
    }

    cleanupObservers()
    teardownPictureInPictureController()
    loadedUri = uri
    hasRequestedPreload = false

    guard let url = URL(string: uri) else {
      return
    }

    let item = AVPlayerItem(url: url)
    let newPlayer = AVQueuePlayer(playerItem: item)
    newPlayer.automaticallyWaitsToMinimizeStalling = true
    player = newPlayer
    playerViewController.player = newPlayer
    newPlayer.isMuted = muted

    setupObservers(for: newPlayer, item: item)
    applyLoopMode(for: newPlayer, item: item)

    if preload && !autoplay {
      configurePreload(for: item, player: newPlayer)
    }

    if allowsPictureInPicture {
      DispatchQueue.main.async { [weak self] in
        self?.pipSetupRetryCount = 0
        self?.setupPictureInPictureControllerIfNeeded()
      }
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
        if self.allowsPictureInPicture {
          self.pipSetupRetryCount = 0
          self.setupPictureInPictureControllerIfNeeded()
        }
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
      guard let self, !self.loop else {
        return
      }
      self.onEnd()
    }
  }

  private func applyLoopModeIfNeeded() {
    guard let queuePlayer = player as? AVQueuePlayer,
          let item = queuePlayer.currentItem else {
      return
    }
    applyLoopMode(for: queuePlayer, item: item)
  }

  private func applyLoopMode(for player: AVQueuePlayer, item: AVPlayerItem) {
    playerLooper?.disableLooping()
    playerLooper = nil

    if loop {
      playerLooper = AVPlayerLooper(player: player, templateItem: item)
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
    teardownPictureInPictureController()
    playerLooper?.disableLooping()
    playerLooper = nil
    player?.pause()
    player?.replaceCurrentItem(with: nil)
    playerViewController.player = nil
    pipSetupRetryCount = 0

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

private final class PictureInPictureDelegate: NSObject, AVPictureInPictureControllerDelegate {
  private let onChange: (Bool) -> Void

  init(onChange: @escaping (Bool) -> Void) {
    self.onChange = onChange
  }

  func pictureInPictureControllerDidStartPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onChange(true)
  }

  func pictureInPictureControllerDidStopPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onChange(false)
  }

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    failedToStartPictureInPictureWithError error: Error
  ) {
    NSLog("[OrcaVideoPlayer] PiP failed to start: \(error.localizedDescription)")
  }
}
