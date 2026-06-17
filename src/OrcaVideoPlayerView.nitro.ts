import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules';

export interface VideoSource {
  uri: string;
}

export type ResizeMode = 'cover' | 'contain' | 'stretch';

export interface OrcaVideoPlayerViewProps extends HybridViewProps {
  source: VideoSource;
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  resizeMode: ResizeMode;
  preload: boolean;
  onProgress: (time: number) => void;
  onEnd: () => void;
}

export interface OrcaVideoPlayerViewMethods extends HybridViewMethods {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
}

export type OrcaVideoPlayerView = HybridView<
  OrcaVideoPlayerViewProps,
  OrcaVideoPlayerViewMethods
>;
