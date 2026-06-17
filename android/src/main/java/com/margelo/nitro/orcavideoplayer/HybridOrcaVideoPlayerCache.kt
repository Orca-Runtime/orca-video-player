package com.margelo.nitro.orcavideoplayer

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.NullType
import com.margelo.nitro.core.Promise
import java.io.File
import java.net.URL
import java.security.MessageDigest

@DoNotStrip
class HybridOrcaVideoPlayerCache : HybridOrcaVideoPlayerCacheSpec() {
  private val activeDownloads = mutableSetOf<String>()

  override fun preload(source: VideoSource): Promise<Unit> {
    val uri = source.uri
    return Promise.async {
      if (isCached(uri)) {
        return@async
      }

      synchronized(activeDownloads) {
        if (activeDownloads.contains(uri)) {
          return@async
        }
        activeDownloads.add(uri)
      }

      try {
        val destination = cacheFile(uri)
        destination.parentFile?.mkdirs()
        URL(uri).openStream().use { input ->
          destination.outputStream().use { output ->
            input.copyTo(output)
          }
        }
      } finally {
        synchronized(activeDownloads) {
          activeDownloads.remove(uri)
        }
      }
    }
  }

  override fun isCached(uri: String): Boolean {
    return cacheFile(uri).exists()
  }

  override fun getCachedUri(uri: String): Variant_NullType_String {
    val file = cacheFile(uri)
    return if (file.exists()) {
      Variant_NullType_String.create(file.toURI().toString())
    } else {
      Variant_NullType_String.create(NullType.NULL)
    }
  }

  override fun clearCache(uri: String): Promise<Unit> {
    return Promise.async {
      cacheFile(uri).delete()
    }
  }

  override fun clearAllCache(): Promise<Unit> {
    return Promise.async {
      cacheDirectory().deleteRecursively()
      cacheDirectory().mkdirs()
    }
  }

  private fun cacheDirectory(): File {
    val context =
      OrcaVideoPlayerContextHolder.applicationContext
        ?: throw IllegalStateException("OrcaVideoPlayer cache is not initialized")
    return File(context.cacheDir, "orca-video-cache")
  }

  private fun cacheFile(uri: String): File {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(uri.toByteArray()).joinToString("") { "%02x".format(it) }
    return File(cacheDirectory(), "$hash.mp4")
  }
}
