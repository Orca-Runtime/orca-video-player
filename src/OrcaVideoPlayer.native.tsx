import type { ComponentProps } from 'react';
import { callback, getHostComponent } from 'react-native-nitro-modules';
import type { OrcaVideoPlayerProps } from './types';
import { resolveVideoSource } from './videoSource';
import OrcaVideoPlayerViewConfig from './OrcaVideoPlayerViewConfig';

const NativeOrcaVideoPlayerView = getHostComponent(
  'OrcaVideoPlayerView',
  () => OrcaVideoPlayerViewConfig
);

type NativeOrcaVideoPlayerViewProps = ComponentProps<
  typeof NativeOrcaVideoPlayerView
>;

const noop = () => {};

export function OrcaVideoPlayer({
  source,
  uriIndex = 0,
  autoplay = false,
  muted = false,
  controls = false,
  resizeMode = 'contain',
  preload = false,
  onProgress,
  onEnd,
  style,
}: OrcaVideoPlayerProps) {
  const resolvedSource = resolveVideoSource(source, uriIndex);

  const nativeProps = {
    style,
    source: resolvedSource,
    autoplay,
    muted,
    controls,
    resizeMode,
    preload,
    onProgress: callback(onProgress ?? noop),
    onEnd: callback(onEnd ?? noop),
  } as NativeOrcaVideoPlayerViewProps;

  return <NativeOrcaVideoPlayerView {...nativeProps} />;
}
