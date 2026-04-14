import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { BAGUIO_CENTER } from '../constants/config';
import { colors } from '../constants/theme';

export type LatLng = { latitude: number; longitude: number };

type Props = {
  driverPosition?: LatLng;
  polyline?: LatLng[];
  region?: Region;
};

export function SabayMap({ driverPosition, polyline, region }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={region ?? BAGUIO_CENTER}
      showsUserLocation={false}
      loadingEnabled
    >
      {polyline && polyline.length >= 2 ? (
        <Polyline coordinates={polyline} strokeColor={colors.primary} strokeWidth={4} />
      ) : null}
      {driverPosition ? (
        <Marker coordinate={driverPosition} title="Driver" pinColor={colors.primary} />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
