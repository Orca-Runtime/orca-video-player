import type { StyleProp, ViewStyle } from 'react-native';

export type ResizeMode = 'cover' | 'contain' | 'stretch';

export interface OrcaVideoPlayerHandle {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  enterPictureInPicture(): void;
  exitPictureInPicture(): void;
}

export interface VideoSource {
  uri: string | string[];
  headers?: Record<string, string>;
  type?: string;
}

export interface OrcaVideoPlayerProps {
  source: VideoSource;
  /** Index into `source.uri` when it is an array. Defaults to 0. */
  uriIndex?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  resizeMode?: ResizeMode;
  /** Prepare and buffer the video without starting playback (unless autoplay is also set). */
  preload?: boolean;
  /** Replay the same source indefinitely. When true, `onEnd` is not called. */
  loop?: boolean;
  /** Enable Picture-in-Picture support. */
  allowsPictureInPicture?: boolean;
  /** Automatically enter PiP when the app moves to the background. */
  autoEnterPictureInPicture?: boolean;
  onProgress?: (time: number) => void;
  onEnd?: () => void;
  onPictureInPictureChange?: (active: boolean) => void;
  style?: StyleProp<ViewStyle>;
}
