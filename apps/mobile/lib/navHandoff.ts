import { Linking } from 'react-native';
import {
  buildDirectionsForProvider,
  type LatLng,
  type MapsProvider,
} from '@drivey/shared';

export async function openInExternalMap(
  provider: MapsProvider,
  args: { origin?: LatLng; destination: LatLng; waypoints?: LatLng[] },
) {
  const link = buildDirectionsForProvider(provider, args);
  if (link.native) {
    const can = await Linking.canOpenURL(link.native);
    if (can) {
      await Linking.openURL(link.native);
      return;
    }
  }
  await Linking.openURL(link.https);
}
