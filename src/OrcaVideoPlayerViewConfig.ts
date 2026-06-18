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
    loop: true,
    allowsPictureInPicture: true,
    autoEnterPictureInPicture: true,
    onProgress: true,
    onEnd: true,
    onPictureInPictureChange: true,
    hybridRef: true,
  },
} satisfies ViewConfig<Record<string, unknown>>;

export default OrcaVideoPlayerViewConfig;
