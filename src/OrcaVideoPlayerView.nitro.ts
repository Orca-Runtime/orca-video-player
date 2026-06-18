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
  loop: boolean;
  allowsPictureInPicture: boolean;
  autoEnterPictureInPicture: boolean;
  onProgress: (time: number) => void;
  onEnd: () => void;
  onPictureInPictureChange: (active: boolean) => void;
}

export interface OrcaVideoPlayerViewMethods extends HybridViewMethods {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  enterPictureInPicture(): void;
  exitPictureInPicture(): void;
}

export type OrcaVideoPlayerView = HybridView<
  OrcaVideoPlayerViewProps,
  OrcaVideoPlayerViewMethods
>;
