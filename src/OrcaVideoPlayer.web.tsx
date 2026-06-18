import {
  createElement,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  OrcaVideoPlayerProps,
  ResizeMode,
  OrcaVideoPlayerHandle,
} from './types';
import { resolveVideoSource } from './videoSource';

type VideoElement = {
  src: string;
  load: () => void;
  play: () => Promise<void>;
  pause: () => void;
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
  const resolvedSource = resolveVideoSource(source, uriIndex);
  const videoRef = useRef<VideoElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      play() {
        videoRef.current?.play().catch(() => {});
      },
      pause() {
        videoRef.current?.pause();
      },
      seekTo(seconds) {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
    }),
    []
  );

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
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
