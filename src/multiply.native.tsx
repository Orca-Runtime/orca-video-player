import { NitroModules } from 'react-native-nitro-modules';
import type { OrcaVideoPlayer } from './OrcaVideoPlayer.nitro';

const OrcaVideoPlayerHybridObject =
  NitroModules.createHybridObject<OrcaVideoPlayer>('OrcaVideoPlayer');

export function multiply(a: number, b: number): number {
  return OrcaVideoPlayerHybridObject.multiply(a, b);
}
