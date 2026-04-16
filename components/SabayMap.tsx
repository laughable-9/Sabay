import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { BAGUIO_CENTER } from '../constants/config';
import { colors } from '../constants/theme';

export type LatLng = { latitude: number; longitude: number };

type Props = {
  driverPosition?: LatLng;
  polyline?: LatLng[];
  region?: Region;
  showEndpoints?: boolean;
};

export function SabayMap({ driverPosition, polyline, region, showEndpoints = true }: Props) {
  const start = polyline && polyline.length > 0 ? polyline[0] : undefined;
  const end = polyline && polyline.length > 1 ? polyline[polyline.length - 1] : undefined;

  // Controlled region so the map re-centers when we switch phases (pickup
  // approach → full trip). initialRegion only applies on mount which left
  // phase 2 showing the phase 1 viewport with the new polyline off-screen.
  return (
    <MapView
      style={styles.map}
      region={region ?? BAGUIO_CENTER}
      showsUserLocation={false}
      loadingEnabled
    >
      {polyline && polyline.length >= 2 ? (
        <Polyline coordinates={polyline} strokeColor={colors.primary} strokeWidth={4} />
      ) : null}
      {showEndpoints && start ? (
        <Marker coordinate={start} title="Pickup" pinColor={colors.primary} />
      ) : null}
      {showEndpoints && end ? (
        <Marker coordinate={end} title="Drop-off" pinColor={colors.danger} />
      ) : null}
      {driverPosition ? (
        <Marker coordinate={driverPosition} title="Driver" pinColor={colors.warning} />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
