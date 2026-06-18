import { useState, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  OrcaVideoPlayer,
  useVideoCache,
} from '@orca-runtime/orca-video-player';
import type { OrcaVideoPlayerHandle } from '@orca-runtime/orca-video-player';

const SAMPLE_VIDEO_URIS = [
  'https://www.w3schools.com/tags/mov_bbb.mp4',
  'https://avtshare01.rz.tu-ilmenau.de/avt-vqdb-uhd-1/test_1/segments/cutting_orange_tuil_200kbps_360p_59.94fps_h264.mp4',
];

export default function App() {
  const [uriIndex, setUriIndex] = useState(0);
  const playerRef = useRef<OrcaVideoPlayerHandle>(null);

  const {
    source,
    uris,
    activeUri,
    cachedByUri,
    isPreloading,
    preload,
    clearCache,
  } = useVideoCache(
    { uri: SAMPLE_VIDEO_URIS },
    { autoPreload: false, preferCache: true, uriIndex }
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.uriRow}>
          {uris.map((uri, index) => (
            <Pressable
              key={uri}
              style={[
                styles.uriButton,
                uriIndex === index && styles.uriButtonActive,
              ]}
              onPress={() => setUriIndex(index)}
            >
              <Text style={styles.uriButtonText}>Video {index + 1}</Text>
              <Text style={styles.uriBadge}>
                {cachedByUri[uri] ? 'Cached' : 'Remote'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => preload()}>
            <Text style={styles.buttonText}>
              {isPreloading ? 'Preloading…' : 'Preload all'}
            </Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => clearCache()}>
            <Text style={styles.buttonText}>Clear cache</Text>
          </Pressable>
        </View>

        <Text style={styles.activeUri} numberOfLines={1}>
          Active: {activeUri}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.players}>
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>With preload (looping)</Text>
          <OrcaVideoPlayer
            ref={playerRef}
            style={styles.player}
            source={source}
            uriIndex={uriIndex}
            preload
            loop
            autoplay
            muted
            controls
            allowsPictureInPicture
            autoEnterPictureInPicture
            resizeMode="cover"
            onProgress={(time) => console.log('preload player', time)}
            onEnd={() => console.log('preload player ended')}
            onPictureInPictureChange={(active) =>
              console.log('preload player PiP', active)
            }
          />
          <View style={styles.controlBar}>
            <Pressable
              style={styles.controlButton}
              onPress={() => playerRef.current?.play()}
            >
              <Text style={styles.controlButtonText}>Play</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => playerRef.current?.pause()}
            >
              <Text style={styles.controlButtonText}>Pause</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => playerRef.current?.seekTo(10)}
            >
              <Text style={styles.controlButtonText}>Seek to 10s</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => playerRef.current?.enterPictureInPicture()}
            >
              <Text style={styles.controlButtonText}>PiP</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>Without preload</Text>
          <OrcaVideoPlayer
            style={styles.player}
            source={source}
            uriIndex={uriIndex}
            preload={false}
            autoplay={false}
            muted
            controls
            allowsPictureInPicture
            autoEnterPictureInPicture
            resizeMode="cover"
            onProgress={(time) => console.log('no-preload player', time)}
            onEnd={() => console.log('no-preload player ended')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: 48,
  },
  toolbar: {
    gap: 12,
    padding: 12,
    backgroundColor: '#111',
  },
  uriRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uriButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    gap: 4,
  },
  uriButtonActive: {
    borderColor: '#2f6fed',
    backgroundColor: '#18243d',
  },
  uriButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  uriBadge: {
    color: '#aaa',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeUri: {
    color: '#888',
    fontSize: 12,
  },
  players: {
    gap: 16,
    padding: 12,
  },
  playerSection: {
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  player: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
