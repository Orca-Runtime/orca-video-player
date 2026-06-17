import type { VideoSource } from './types';

export interface OrcaVideoPlayerCacheApiType {
  preload(source: VideoSource): Promise<void>;
  isCached(uri: string): boolean;
  getCachedUri(uri: string): string | null;
  clearCache(uri: string): Promise<void>;
  clearAllCache(): Promise<void>;
}

export { OrcaVideoPlayerCacheApi } from './cache.web';
