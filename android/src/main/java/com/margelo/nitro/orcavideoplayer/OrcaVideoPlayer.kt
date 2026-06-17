package com.margelo.nitro.orcavideoplayer
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class OrcaVideoPlayer : HybridOrcaVideoPlayerSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
