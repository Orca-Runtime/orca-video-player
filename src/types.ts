import type { StyleProp, ViewStyle } from 'react-native';

export type ResizeMode = 'cover' | 'contain' | 'stretch';

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
  onProgress?: (time: number) => void;
  onEnd?: () => void;
  style?: StyleProp<ViewStyle>;
}
