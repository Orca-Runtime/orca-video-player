import { NitroModules } from 'react-native-nitro-modules';
import type { OrcaVideoPlayerCache } from './OrcaVideoPlayerCache.nitro';
import type { VideoSource } from './types';
import { getVideoUris } from './videoSource';

const cache = NitroModules.createHybridObject<OrcaVideoPlayerCache>(
  'OrcaVideoPlayerCache'
);

export const OrcaVideoPlayerCacheApi = {
  preload(source: VideoSource): Promise<void> {
    const uris = getVideoUris(source.uri);
    return Promise.all(uris.map((uri) => cache.preload({ uri }))).then(
      () => {}
    );
  },

  isCached(uri: string): boolean {
    return cache.isCached(uri);
  },

  getCachedUri(uri: string): string | null {
    return cache.getCachedUri(uri);
  },

  clearCache(uri: string): Promise<void> {
    return cache.clearCache(uri);
  },

  clearAllCache(): Promise<void> {
    return cache.clearAllCache();
  },
};
