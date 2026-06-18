import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ComponentProps } from 'react';
import { callback, getHostComponent } from 'react-native-nitro-modules';
import type { OrcaVideoPlayerProps, OrcaVideoPlayerHandle } from './types';
import { resolveVideoSource } from './videoSource';
import OrcaVideoPlayerViewConfig from './OrcaVideoPlayerViewConfig';
import type {
  OrcaVideoPlayerViewProps,
  OrcaVideoPlayerViewMethods,
  OrcaVideoPlayerView as NitroOrcaVideoPlayerView,
} from './OrcaVideoPlayerView.nitro';

type OrcaVideoPlayerView = NitroOrcaVideoPlayerView;

const NativeOrcaVideoPlayerView = getHostComponent<
  OrcaVideoPlayerViewProps,
  OrcaVideoPlayerViewMethods
>('OrcaVideoPlayerView', () => OrcaVideoPlayerViewConfig as any);

type NativeOrcaVideoPlayerViewProps = ComponentProps<
  typeof NativeOrcaVideoPlayerView
>;

const noop = () => {};

export const OrcaVideoPlayer = forwardRef<
  OrcaVideoPlayerHandle,
  OrcaVideoPlayerProps
>(function OrcaVideoPlayerWithRef(
  {
    source,
    uriIndex = 0,
    autoplay = false,
    muted = false,
    controls = false,
    resizeMode = 'contain',
    preload = false,
    loop = false,
    onProgress,
    onEnd,
    style,
  },
  ref
) {
  const nativeRef = useRef<OrcaVideoPlayerView>(null);

  useImperativeHandle(
    ref,
    () => ({
      play() {
        nativeRef.current?.play();
      },
      pause() {
        nativeRef.current?.pause();
      },
      seekTo(seconds) {
        nativeRef.current?.seekTo(seconds);
      },
    }),
    []
  );

  const resolvedSource = resolveVideoSource(source, uriIndex);

  const nativeProps = {
    style,
    source: resolvedSource,
    autoplay,
    muted,
    controls,
    resizeMode,
    preload,
    loop,
    onProgress: callback(onProgress ?? noop),
    onEnd: callback(onEnd ?? noop),
    hybridRef: callback((instance: OrcaVideoPlayerView) => {
      nativeRef.current = instance;
    }),
  } as NativeOrcaVideoPlayerViewProps;

  return <NativeOrcaVideoPlayerView {...nativeProps} />;
});
