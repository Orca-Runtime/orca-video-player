package com.margelo.nitro.orcavideoplayer

import android.app.Activity
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.uimanager.ThemedReactContext

class HybridOrcaVideoPlayerView(
  private val context: ThemedReactContext,
) : HybridOrcaVideoPlayerViewSpec() {
  override var source: VideoSource = VideoSource("")
  override var autoplay: Boolean = false
  override var muted: Boolean = false
  override var controls: Boolean = false
  override var resizeMode: ResizeMode = ResizeMode.CONTAIN
  override var preload: Boolean = false
  override var loop: Boolean = false
  override var allowsPictureInPicture: Boolean = false
  override var autoEnterPictureInPicture: Boolean = false
  override var onProgress: (time: Double) -> Unit = {}
  override var onEnd: () -> Unit = {}
  override var onPictureInPictureChange: (active: Boolean) -> Unit = {}

  private val playerView = PlayerView(context)
  private val player: ExoPlayer = ExoPlayer.Builder(context).build()
  private val progressHandler = Handler(Looper.getMainLooper())
  private var loadedUri: String = ""
  private var isDestroyed = false

  private val progressRunnable =
    object : Runnable {
      override fun run() {
        if (player.playbackState != Player.STATE_IDLE) {
          onProgress(player.currentPosition / 1000.0)
        }
        progressHandler.postDelayed(this, 250)
      }
    }

  private val playerListener =
    object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED && !loop) {
          onEnd()
        }
      }
    }

  override val view: View
    get() = playerView

  init {
    playerView.player = player
    playerView.useController = false
    player.addListener(playerListener)
    progressHandler.post(progressRunnable)
  }

  override fun beforeUpdate() {}

  override fun afterUpdate() {
    applySourceIfNeeded()
    player.volume = if (muted) 0f else 1f
    playerView.useController = controls
    playerView.resizeMode = mapResizeMode(resizeMode)
    player.repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    updatePictureInPictureRegistration()

    if (autoplay) {
      player.playWhenReady = true
    }
  }

  override fun onDropView() {
    cleanup()
  }

  override fun play() {
    player.play()
  }

  override fun pause() {
    player.pause()
  }

  override fun seekTo(seconds: Double) {
    player.seekTo((seconds * 1000).toLong())
  }

  override fun enterPictureInPicture() {
    val activity = context.currentActivity ?: return
    enterPictureInPictureInternal(activity)
  }

  override fun exitPictureInPicture() {
    val activity = context.currentActivity ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && activity.isInPictureInPictureMode) {
      activity.moveTaskToBack(false)
    }
  }

  internal fun enterPictureInPictureInternal(activity: Activity) {
    if (!allowsPictureInPicture || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    OrcaVideoPlayerPipHelper.registerPipView(this)
    val params = OrcaVideoPlayerPipHelper.buildPictureInPictureParams() ?: return
    activity.enterPictureInPictureMode(params)
  }

  internal fun isPlaying(): Boolean {
    return player.isPlaying
  }

  internal fun notifyPictureInPictureChange(active: Boolean) {
    onPictureInPictureChange(active)
  }

  private fun updatePictureInPictureRegistration() {
    OrcaVideoPlayerPipHelper.unregisterPipView(this)
    OrcaVideoPlayerPipHelper.registerPipView(this)
    if (allowsPictureInPicture && autoEnterPictureInPicture) {
      OrcaVideoPlayerPipHelper.registerAutoEnterCandidate(this)
    }
  }

  private fun applySourceIfNeeded() {
    val uri = source.uri
    if (uri.isEmpty() || uri == loadedUri) {
      return
    }

    loadedUri = uri
    player.setMediaItem(MediaItem.fromUri(uri))
    player.prepare()

    if (autoplay) {
      player.playWhenReady = true
    } else {
      player.playWhenReady = false
    }
  }

  private fun mapResizeMode(mode: ResizeMode): Int {
    return when (mode) {
      ResizeMode.COVER -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
      ResizeMode.CONTAIN -> AspectRatioFrameLayout.RESIZE_MODE_FIT
      ResizeMode.STRETCH -> AspectRatioFrameLayout.RESIZE_MODE_FILL
    }
  }

  private fun cleanup() {
    if (isDestroyed) {
      return
    }
    isDestroyed = true
    OrcaVideoPlayerPipHelper.unregisterPipView(this)
    progressHandler.removeCallbacks(progressRunnable)
    player.removeListener(playerListener)
    player.stop()
    player.release()
    loadedUri = ""
  }
}
