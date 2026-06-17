import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { OrcaVideoPlayerProps, ResizeMode } from './types';
import { resolveVideoSource } from './videoSource';

type VideoElement = {
  src: string;
  load: () => void;
  play: () => Promise<void>;
  currentTime: number;
  preload: string;
};

function mapObjectFit(resizeMode: ResizeMode): string {
  switch (resizeMode) {
    case 'cover':
      return 'cover';
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
  }
}

export function OrcaVideoPlayer({
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
}: OrcaVideoPlayerProps) {
  const resolvedSource = resolveVideoSource(source, uriIndex);
  const videoRef = useRef<VideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.src = resolvedSource.uri;
    video.load();

    if (autoplay) {
      video.play().catch(() => {});
    } else if (preload) {
      video.preload = 'auto';
    }
  }, [autoplay, preload, resolvedSource.uri]);

  return (
    <View style={[styles.container, style]}>
      {createElement('video', {
        ref: (element: VideoElement | null) => {
          videoRef.current = element;
        },
        autoPlay: autoplay,
        muted,
        controls,
        loop,
        playsInline: true,
        style: {
          width: '100%',
          height: '100%',
          objectFit: mapObjectFit(resizeMode),
        },
        onTimeUpdate: () => {
          onProgress?.(videoRef.current?.currentTime ?? 0);
        },
        onEnded: () => {
          if (!loop) {
            onEnd?.();
          }
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
