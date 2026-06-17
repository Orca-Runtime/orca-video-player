import { describe, expect, it } from '@jest/globals';
import { OrcaVideoPlayer } from '../OrcaVideoPlayer.web';
import type { OrcaVideoPlayerProps } from '../types';

describe('OrcaVideoPlayer', () => {
  it('exports the component', () => {
    expect(OrcaVideoPlayer).toBeDefined();
    expect(typeof OrcaVideoPlayer).toBe('function');
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
      onProgress: (time) => {
        expect(time).toBeGreaterThanOrEqual(0);
      },
      onEnd: () => {},
    };

    expect(Array.isArray(props.source.uri)).toBe(true);
  });
});
