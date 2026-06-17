import type { VideoSource } from './types';

export interface ResolvedVideoSource extends Omit<VideoSource, 'uri'> {
  uri: string;
}

export function getVideoUris(uri: string | string[]): string[] {
  return Array.isArray(uri) ? uri : [uri];
}

export function resolveVideoSource(
  source: VideoSource,
  index = 0
): ResolvedVideoSource {
  const uris = getVideoUris(source.uri);
  const uri = uris[index] ?? uris[0] ?? '';
  return { ...source, uri };
}
