#include <jni.h>
#include "orcavideoplayerOnLoad.hpp"

#include <fbjni/fbjni.h>


JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::orcavideoplayer::registerAllNatives();
  });
}