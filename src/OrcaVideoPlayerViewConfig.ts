import type { ViewConfig } from 'react-native-nitro-modules';

const OrcaVideoPlayerViewConfig = {
  uiViewClassName: 'OrcaVideoPlayerView',
  supportsRawText: false,
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    source: true,
    autoplay: true,
    muted: true,
    controls: true,
    resizeMode: true,
    preload: true,
    onProgress: true,
    onEnd: true,
    hybridRef: true,
  },
} satisfies ViewConfig<Record<string, unknown>>;

export default OrcaVideoPlayerViewConfig;
