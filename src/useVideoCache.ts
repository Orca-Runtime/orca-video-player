import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrcaVideoPlayerCacheApi } from './cache';
import type { VideoSource } from './types';
import { getVideoUris, resolveVideoSource } from './videoSource';

export interface UseVideoCacheOptions {
  /** Automatically download the video to disk cache when the hook mounts. */
  autoPreload?: boolean;
  /** Prefer the cached local URI when passing source to OrcaVideoPlayer. */
  preferCache?: boolean;
  /** Active URI when `source.uri` is an array. Defaults to 0. */
  uriIndex?: number;
}

export interface UseVideoCacheResult {
  source: VideoSource;
  uris: string[];
  activeUri: string;
  isCached: boolean;
  cachedByUri: Record<string, boolean>;
  isPreloading: boolean;
  error: Error | null;
  preload: () => Promise<void>;
  clearCache: () => Promise<void>;
}

function getCachedByUri(uris: string[]): Record<string, boolean> {
  return Object.fromEntries(
    uris.map((uri) => [uri, OrcaVideoPlayerCacheApi.isCached(uri)])
  );
}

export function useVideoCache(
  source: VideoSource,
  options: UseVideoCacheOptions = {}
): UseVideoCacheResult {
  const { autoPreload = false, preferCache = true, uriIndex = 0 } = options;
  const uris = useMemo(() => getVideoUris(source.uri), [source.uri]);
  const activeUri = uris[uriIndex] ?? uris[0] ?? '';

  const [cachedByUri, setCachedByUri] = useState<Record<string, boolean>>(() =>
    getCachedByUri(uris)
  );
  const [isPreloading, setIsPreloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isCached = useMemo(
    () => uris.length > 0 && uris.every((uri) => cachedByUri[uri]),
    [cachedByUri, uris]
  );

  const resolvedSource = useMemo<VideoSource>(() => {
    const base = resolveVideoSource(source, uriIndex);
    if (!preferCache || !activeUri) {
      return base;
    }

    const cachedUri = OrcaVideoPlayerCacheApi.getCachedUri(activeUri);
    if (!cachedUri) {
      return base;
    }

    return { ...base, uri: cachedUri };
  }, [activeUri, preferCache, source, uriIndex]);

  const refreshCacheState = useCallback(() => {
    setCachedByUri(getCachedByUri(uris));
  }, [uris]);

  const preload = useCallback(async () => {
    setIsPreloading(true);
    setError(null);

    try {
      await Promise.all(
        uris.map((uri) => OrcaVideoPlayerCacheApi.preload({ ...source, uri }))
      );
      refreshCacheState();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsPreloading(false);
    }
  }, [refreshCacheState, source, uris]);

  const clearCache = useCallback(async () => {
    await Promise.all(
      uris.map((uri) => OrcaVideoPlayerCacheApi.clearCache(uri))
    );
    refreshCacheState();
  }, [refreshCacheState, uris]);

  useEffect(() => {
    refreshCacheState();
  }, [refreshCacheState]);

  useEffect(() => {
    if (!autoPreload) {
      return;
    }

    preload().catch(() => {});
  }, [autoPreload, preload]);

  return {
    source: resolvedSource,
    uris,
    activeUri,
    isCached,
    cachedByUri,
    isPreloading,
    error,
    preload,
    clearCache,
  };
}
