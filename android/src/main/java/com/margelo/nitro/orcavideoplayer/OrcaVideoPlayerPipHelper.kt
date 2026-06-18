package com.margelo.nitro.orcavideoplayer

import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational

object OrcaVideoPlayerPipHelper {
  private var autoEnterCandidate: HybridOrcaVideoPlayerView? = null
  private var pipCallbackView: HybridOrcaVideoPlayerView? = null

  fun registerPipView(view: HybridOrcaVideoPlayerView) {
    if (view.allowsPictureInPicture) {
      pipCallbackView = view
    } else if (pipCallbackView === view) {
      pipCallbackView = null
    }
  }

  fun registerAutoEnterCandidate(view: HybridOrcaVideoPlayerView) {
    autoEnterCandidate = view
  }

  fun unregisterPipView(view: HybridOrcaVideoPlayerView) {
    if (autoEnterCandidate === view) {
      autoEnterCandidate = null
    }
    if (pipCallbackView === view) {
      pipCallbackView = null
    }
  }

  fun onUserLeaveHint(activity: Activity) {
    val candidate = autoEnterCandidate ?: return
    if (!candidate.allowsPictureInPicture || !candidate.autoEnterPictureInPicture) {
      return
    }
    if (!candidate.isPlaying()) {
      return
    }
    candidate.enterPictureInPictureInternal(activity)
  }

  fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    pipCallbackView?.notifyPictureInPictureChange(isInPictureInPictureMode)
  }

  fun buildPictureInPictureParams(): PictureInPictureParams? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return null
    }
    return PictureInPictureParams.Builder()
      .setAspectRatio(Rational(16, 9))
      .build()
  }
}
