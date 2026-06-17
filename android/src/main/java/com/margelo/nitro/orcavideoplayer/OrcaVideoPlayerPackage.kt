package com.margelo.nitro.orcavideoplayer

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.margelo.nitro.orcavideoplayer.views.HybridOrcaVideoPlayerViewManager

class OrcaVideoPlayerPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider { HashMap() }
    }

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> {
        OrcaVideoPlayerContextHolder.applicationContext = reactContext.applicationContext
        return listOf(HybridOrcaVideoPlayerViewManager())
    }

    companion object {
        init {
            System.loadLibrary("orcavideoplayer")
        }
    }
}
