# orca-video-player

React Native video player with disk caching, preloading, and multi-URI support. Built on [Nitro Modules](https://nitro.margelo.com/).

## Installation

```sh
npm install orca-video-player react-native-nitro-modules
```

> `react-native-nitro-modules` is required.

After installing or changing native code, run:

```sh
yarn nitrogen   # first time / after *.nitro.ts changes
cd ios && pod install
```

## Quick start

```tsx
import { OrcaVideoPlayer } from 'orca-video-player';

<OrcaVideoPlayer
  source={{ uri: 'https://example.com/video.mp4' }}
  autoplay
  muted
  controls
  resizeMode="cover"
  onProgress={(time) => console.log(time)}
  onEnd={() => console.log('ended')}
/>;
```

## OrcaVideoPlayer props

| Prop         | Type                                    | Default     | Description |
| ------------ | --------------------------------------- | ----------- | ----------- |
| `source`     | `VideoSource`                           | required    | Video source (single or multiple URIs) |
| `uriIndex`   | `number`                                | `0`         | Index into `source.uri` when it is an array |
| `autoplay`   | `boolean`                               | `false`     | Start playback automatically |
| `muted`      | `boolean`                               | `false`     | Mute audio |
| `controls`   | `boolean`                               | `false`     | Show native playback controls |
| `resizeMode` | `'cover' \| 'contain' \| 'stretch'`   | `'contain'` | How video fills the view |
| `preload`    | `boolean`                               | `false`     | Buffer the video in the player without starting playback (unless `autoplay` is also set) |
| `onProgress` | `(time: number) => void`                | —           | Called with current time in seconds |
| `onEnd`      | `() => void`                            | —           | Called when playback finishes |
| `style`      | `StyleProp<ViewStyle>`                  | —           | Container style |

### VideoSource

```ts
interface VideoSource {
  uri: string | string[];
  headers?: Record<string, string>;
  type?: string;
}
```

## Multiple URIs

Pass an array of remote URLs and select which one to play with `uriIndex`:

```tsx
import { useState } from 'react';
import { OrcaVideoPlayer } from 'orca-video-player';

const VIDEOS = [
  'https://example.com/video-a.mp4',
  'https://example.com/video-b.mp4',
];

const [index, setIndex] = useState(0);

<OrcaVideoPlayer
  source={{ uri: VIDEOS }}
  uriIndex={index}
  controls
  resizeMode="cover"
/>;
```

## Player preload vs disk cache

There are two different preload mechanisms:

| Mechanism          | API                                      | Scope                              | Use case |
| ------------------ | ---------------------------------------- | ---------------------------------- | -------- |
| **Player preload** | `OrcaVideoPlayer` `preload` prop         | In-memory, tied to mounted player  | Buffer early on the same screen |
| **Disk cache**     | `OrcaVideoPlayerCacheApi` / `useVideoCache` | Persistent on device, global    | Preload at app start, play on another screen |

### Player preload (in-memory)

Prepares the native player and buffers media without starting playback:

```tsx
<OrcaVideoPlayer
  source={{ uri: 'https://example.com/video.mp4' }}
  preload
  autoplay={false}
  controls
/>;
```

> When the player unmounts, this buffer is released. For cross-screen preloading, use the disk cache API below.

### Compare preload modes side by side

```tsx
<OrcaVideoPlayer
  source={{ uri: 'https://example.com/video.mp4' }}
  preload
  autoplay={false}
  controls
/>

<OrcaVideoPlayer
  source={{ uri: 'https://example.com/video.mp4' }}
  preload={false}
  autoplay={false}
  controls
/>;
```

## Disk cache API

`OrcaVideoPlayerCacheApi` is a global native singleton. It downloads videos to the device cache directory and resolves them to a local `file://` URI.

```tsx
import { OrcaVideoPlayerCacheApi } from 'orca-video-player';

// Download one video
await OrcaVideoPlayerCacheApi.preload({
  uri: 'https://example.com/video.mp4',
});

// Download multiple videos
await OrcaVideoPlayerCacheApi.preload({
  uri: [
    'https://example.com/video-a.mp4',
    'https://example.com/video-b.mp4',
  ],
});

// Check cache status
OrcaVideoPlayerCacheApi.isCached('https://example.com/video.mp4'); // boolean

// Get local file URI (null if not cached yet)
const localUri = OrcaVideoPlayerCacheApi.getCachedUri(
  'https://example.com/video.mp4'
);

// Clear cache
await OrcaVideoPlayerCacheApi.clearCache('https://example.com/video.mp4');
await OrcaVideoPlayerCacheApi.clearAllCache();
```

### Play from cache

```tsx
const remoteUri = 'https://example.com/video.mp4';
const cachedUri = OrcaVideoPlayerCacheApi.getCachedUri(remoteUri);

<OrcaVideoPlayer
  source={{ uri: cachedUri ?? remoteUri }}
  autoplay
  controls
/>;
```

## useVideoCache hook

React hook that wraps the disk cache API and returns a resolved `source` for `OrcaVideoPlayer`.

```tsx
import { OrcaVideoPlayer, useVideoCache } from 'orca-video-player';

const { source, isCached, isPreloading, preload, clearCache } = useVideoCache(
  { uri: 'https://example.com/video.mp4' },
  {
    autoPreload: false, // download on mount
    preferCache: true,  // use local file URI when available
    uriIndex: 0,        // active URI when uri is an array
  }
);

<OrcaVideoPlayer source={source} controls />;
```

### Hook options

| Option        | Type      | Default | Description |
| ------------- | --------- | ------- | ----------- |
| `autoPreload` | `boolean` | `false` | Download to disk when the hook mounts |
| `preferCache` | `boolean` | `true`  | Resolve `source.uri` to a cached local URI |
| `uriIndex`    | `number`  | `0`     | Active URI when `source.uri` is an array |

### Hook return value

| Field          | Type                      | Description |
| -------------- | ------------------------- | ----------- |
| `source`       | `VideoSource`             | Resolved source (local URI when cached) |
| `uris`         | `string[]`                | All remote URIs |
| `activeUri`    | `string`                  | Currently selected remote URI |
| `isCached`     | `boolean`                 | `true` when all URIs are cached |
| `cachedByUri`  | `Record<string, boolean>` | Per-URI cache status |
| `isPreloading` | `boolean`                 | Download in progress |
| `error`        | `Error \| null`           | Last preload error |
| `preload`      | `() => Promise<void>`     | Manually trigger download |
| `clearCache`   | `() => Promise<void>`     | Clear cache for all URIs in the source |

### Multiple URIs with the hook

```tsx
import { useState } from 'react';
import { OrcaVideoPlayer, useVideoCache } from 'orca-video-player';

const [uriIndex, setUriIndex] = useState(0);

const { source, cachedByUri, preload } = useVideoCache(
  { uri: ['https://example.com/a.mp4', 'https://example.com/b.mp4'] },
  { uriIndex, preferCache: true }
);

// cachedByUri['https://example.com/a.mp4'] → boolean

<OrcaVideoPlayer source={source} uriIndex={uriIndex} controls />;
```

### Auto-preload on mount

```tsx
const { source } = useVideoCache(
  { uri: 'https://example.com/video.mp4' },
  { autoPreload: true, preferCache: true }
);
```

## Preload at app start, play on another screen

Recommended pattern for feed / detail flows:

```tsx
// Root layout / app bootstrap
import { useEffect } from 'react';
import { OrcaVideoPlayerCacheApi } from 'orca-video-player';

const FEED_VIDEOS = [
  'https://example.com/video-a.mp4',
  'https://example.com/video-b.mp4',
];

export function AppBootstrap() {
  useEffect(() => {
    OrcaVideoPlayerCacheApi.preload({ uri: FEED_VIDEOS });
  }, []);

  return <Navigation />;
}
```

```tsx
// Player screen (different route)
import { OrcaVideoPlayer, useVideoCache } from 'orca-video-player';

export function PlayerScreen({ remoteUri }: { remoteUri: string }) {
  const { source } = useVideoCache(
    { uri: remoteUri },
    { preferCache: true }
  );

  return <OrcaVideoPlayer source={source} autoplay controls />;
}
```

> If the user opens the player before preload finishes, `preferCache` falls back to the remote URL automatically.

## Utility helpers

```tsx
import { getVideoUris, resolveVideoSource } from 'orca-video-player';

getVideoUris(['https://a.mp4', 'https://b.mp4']);
// → ['https://a.mp4', 'https://b.mp4']

getVideoUris('https://a.mp4');
// → ['https://a.mp4']

resolveVideoSource({ uri: ['https://a.mp4', 'https://b.mp4'] }, 1);
// → { uri: 'https://b.mp4' }
```

## Platform notes

- **iOS**: Cache stored in `Caches/orca-video-cache/`. Player preload uses `AVPlayer` buffering.
- **Android**: Cache stored in `cacheDir/orca-video-cache/`. Player preload uses ExoPlayer `prepare()`.
- **Web**: Cache uses in-memory blob URLs (not persisted across page reloads).
- Cache may be evicted by the OS at any time. Always fall back to the remote URI.
- Authenticated URLs (`headers`) are not yet supported by the native disk cache downloader.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
