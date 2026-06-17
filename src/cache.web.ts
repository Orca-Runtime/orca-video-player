import type { VideoSource } from './types';
import { getVideoUris } from './videoSource';

const blobUrls = new Map<string, string>();
const inflight = new Map<string, Promise<void>>();

export const OrcaVideoPlayerCacheApi = {
  async preload(source: VideoSource): Promise<void> {
    const uris = getVideoUris(source.uri);
    await Promise.all(uris.map((uri) => this.preloadUri(uri)));
  },

  async preloadUri(uri: string): Promise<void> {
    if (blobUrls.has(uri)) {
      return;
    }

    const pending = inflight.get(uri);
    if (pending) {
      return pending;
    }

    const download = (async () => {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to preload video: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      blobUrls.set(uri, objectUrl);
    })();

    inflight.set(uri, download);

    try {
      await download;
    } finally {
      inflight.delete(uri);
    }
  },

  isCached(uri: string): boolean {
    return blobUrls.has(uri);
  },

  getCachedUri(uri: string): string | null {
    return blobUrls.get(uri) ?? null;
  },

  async clearCache(uri: string): Promise<void> {
    const objectUrl = blobUrls.get(uri);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      blobUrls.delete(uri);
    }
  },

  async clearAllCache(): Promise<void> {
    for (const objectUrl of blobUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }
    blobUrls.clear();
  },
};
