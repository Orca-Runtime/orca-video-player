import { describe, expect, it } from '@jest/globals';
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { OrcaVideoPlayer } from '../OrcaVideoPlayer.web';
import type { OrcaVideoPlayerProps, OrcaVideoPlayerHandle } from '../types';

describe('OrcaVideoPlayer', () => {
  it('exports the component', () => {
    expect(OrcaVideoPlayer).toBeDefined();
  });

  it('accepts the public props shape', () => {
    const props: OrcaVideoPlayerProps = {
      source: {
        uri: ['https://example.com/a.mp4', 'https://example.com/b.mp4'],
      },
      uriIndex: 0,
      autoplay: true,
      muted: true,
      controls: true,
      resizeMode: 'cover',
      allowsPictureInPicture: true,
      autoEnterPictureInPicture: true,
      onProgress: (time) => {
        expect(time).toBeGreaterThanOrEqual(0);
      },
      onEnd: () => {},
      onPictureInPictureChange: (active) => {
        expect(typeof active).toBe('boolean');
      },
    };

    expect(Array.isArray(props.source.uri)).toBe(true);
  });

  it('forwards ref methods and calling them does not throw', () => {
    const ref = React.createRef<OrcaVideoPlayerHandle>();
    React.act(() => {
      TestRenderer.create(
        <OrcaVideoPlayer
          ref={ref}
          source={{ uri: 'https://example.com/v.mp4' }}
          allowsPictureInPicture
        />
      );
    });

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.play).toBe('function');
    expect(typeof ref.current?.pause).toBe('function');
    expect(typeof ref.current?.seekTo).toBe('function');
    expect(typeof ref.current?.enterPictureInPicture).toBe('function');
    expect(typeof ref.current?.exitPictureInPicture).toBe('function');

    expect(() => ref.current?.play()).not.toThrow();
    expect(() => ref.current?.pause()).not.toThrow();
    expect(() => ref.current?.seekTo(30)).not.toThrow();
    expect(() => ref.current?.enterPictureInPicture()).not.toThrow();
    expect(() => ref.current?.exitPictureInPicture()).not.toThrow();
  });
});
