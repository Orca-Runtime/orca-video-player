import type { HybridObject } from 'react-native-nitro-modules';

export interface VideoSource {
  uri: string;
  headers?: Record<string, string>;
}

export interface OrcaVideoPlayerCache extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
  preload(source: VideoSource): Promise<void>;
  isCached(uri: string): boolean;
  getCachedUri(uri: string): string | null;
  clearCache(uri: string): Promise<void>;
  clearAllCache(): Promise<void>;
}
