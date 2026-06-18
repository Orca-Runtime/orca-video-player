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
  paused: boolean;
  ended: boolean;
  requestPictureInPicture: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

type BrowserDocument = {
  pictureInPictureEnabled: boolean;
  pictureInPictureElement: VideoElement | null;
  visibilityState: string;
  exitPictureInPicture: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

function getBrowserDocument(): BrowserDocument | undefined {
  const globalDocument = (globalThis as { document?: BrowserDocument })
    .document;
  return globalDocument;
}

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

function isPictureInPictureSupported(): boolean {
  const browserDocument = getBrowserDocument();
  return browserDocument != null && browserDocument.pictureInPictureEnabled;
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
    allowsPictureInPicture = false,
    autoEnterPictureInPicture = false,
    onProgress,
    onEnd,
    onPictureInPictureChange,
    style,
  },
  ref
) {
  const resolvedSource = resolveVideoSource(source, uriIndex);
  const videoRef = useRef<VideoElement | null>(null);
  const onPictureInPictureChangeRef = useRef(onPictureInPictureChange);

  useEffect(() => {
    onPictureInPictureChangeRef.current = onPictureInPictureChange;
  }, [onPictureInPictureChange]);

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
      enterPictureInPicture() {
        const video = videoRef.current;
        if (
          !allowsPictureInPicture ||
          !video ||
          !isPictureInPictureSupported()
        ) {
          return;
        }
        video.requestPictureInPicture().catch(() => {});
      },
      exitPictureInPicture() {
        const browserDocument = getBrowserDocument();
        if (browserDocument?.pictureInPictureElement) {
          browserDocument.exitPictureInPicture().catch(() => {});
        }
      },
    }),
    [allowsPictureInPicture]
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleEnter = () => {
      onPictureInPictureChangeRef.current?.(true);
    };
    const handleLeave = () => {
      onPictureInPictureChangeRef.current?.(false);
    };

    video.addEventListener('enterpictureinpicture', handleEnter);
    video.addEventListener('leavepictureinpicture', handleLeave);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnter);
      video.removeEventListener('leavepictureinpicture', handleLeave);
    };
  }, [resolvedSource.uri]);

  useEffect(() => {
    const browserDocument = getBrowserDocument();
    if (
      browserDocument == null ||
      !allowsPictureInPicture ||
      !autoEnterPictureInPicture
    ) {
      return;
    }

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (
        browserDocument.visibilityState !== 'hidden' ||
        !video ||
        !isPictureInPictureSupported() ||
        browserDocument.pictureInPictureElement === video
      ) {
        return;
      }

      if (!video.paused && !video.ended) {
        video.requestPictureInPicture().catch(() => {});
      }
    };

    browserDocument.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );
    return () => {
      browserDocument.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [allowsPictureInPicture, autoEnterPictureInPicture, resolvedSource.uri]);

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
