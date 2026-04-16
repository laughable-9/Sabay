import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useApp } from '../context/AppContext';
import { RideCard } from './RideCard';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatDepartureTime } from '../utils/format';
import { formatPHP } from '../utils/pricing';
import { getCoord, isOnTheWay } from '../utils/distance';
import { BAGUIO_CENTER } from '../constants/config';
import { colors, spacing } from '../constants/theme';
import type { Ride, RideRequest } from '../utils/types';

/* ─── Types ─── */

type Step =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'browse'; destination: string; label: string };

/* ─── Constants ─── */

const DESTINATIONS: { key: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'session road', label: 'Session Road', icon: 'road-variant' },
  { key: 'sm baguio', label: 'SM Baguio', icon: 'shopping' },
  { key: 'up baguio', label: 'UP Baguio', icon: 'school' },
  { key: 'la trinidad', label: 'La Trinidad', icon: 'map-marker' },
  { key: 'slu maryheights', label: 'SLU Maryheights', icon: 'school' },
  { key: 'baguio cbd', label: 'Baguio CBD', icon: 'city' },
  { key: 'camp john hay', label: 'Camp John Hay', icon: 'pine-tree' },
  { key: 'itogon', label: 'Itogon', icon: 'map-marker' },
  { key: 'tuba', label: 'Tuba', icon: 'map-marker' },
  { key: 'pinsao proper', label: 'Pinsao Proper', icon: 'home-group' },
  { key: 'trancoville', label: 'Trancoville', icon: 'map-marker' },
  { key: 'ambuklao', label: 'Ambuklao', icon: 'map-marker' },
  { key: 'university of baguio', label: 'University of Baguio', icon: 'school' },
  { key: 'saint louis university', label: 'Saint Louis University', icon: 'school' },
  { key: 'university of the cordilleras', label: 'University of the Cordilleras', icon: 'school' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_PADDING = 44;
const ANIM_DURATION = 280;

const BAGUIO_ZOOMED = {
  latitude: 16.41,
  longitude: 120.596,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

// Simplified map style — muted colors, fewer labels
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4edda' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

const QUICK_CHIPS = DESTINATIONS.slice(0, 5);

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ─── Main Component ─── */

export function RiderHomeContent() {
  const { state, dispatch, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [previewRide, setPreviewRide] = useState<Ride | null>(null);
  const searchRef = useRef<TextInput>(null);

  // Animations
  const searchAnim = useRef(new Animated.Value(0)).current;
  const compactAnim = useRef(new Animated.Value(1)).current;
  const browseAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;

  // All open rides the user can join
  const openRides = useMemo(() => {
    return state.rides
      .filter((r) => r.driverId !== currentUser.id)
      .filter((r) => r.status === 'open')
      .filter((r) => r.passengers.length < r.totalSeats);
  }, [state.rides, currentUser.id]);

  // Filtered destinations for autocomplete
  const filteredDestinations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter((d) => d.label.toLowerCase().includes(q));
  }, [query]);

  // Matching rides for browse step (exact + on-the-way)
  const { exactRides, onTheWayRides } = useMemo(() => {
    if (step.kind !== 'browse') return { exactRides: [] as Ride[], onTheWayRides: [] as Ride[] };
    const dest = step.destination.toLowerCase();
    const exact: Ride[] = [];
    const onWay: Ride[] = [];
    for (const r of openRides) {
      if (r.to.toLowerCase() === dest) {
        exact.push(r);
      } else if (isOnTheWay(r.from, dest, r.to)) {
        onWay.push(r);
      }
    }
    exact.sort((a, b) => a.departureTime - b.departureTime);
    onWay.sort((a, b) => a.departureTime - b.departureTime);
    return { exactRides: exact, onTheWayRides: onWay };
  }, [openRides, step]);

  const totalResults = exactRides.length + onTheWayRides.length;

  const activeRequests = useMemo(
    () =>
      state.rideRequests
        .filter((r) => r.riderId === currentUser.id && r.status === 'open')
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.rideRequests, currentUser.id],
  );

  // ── Animated transitions ──

  const animateTo = useCallback(
    (target: Step) => {
      const anims: Animated.CompositeAnimation[] = [];
      // Hide compact bar
      if (target.kind !== 'idle') {
        anims.push(Animated.timing(compactAnim, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }));
      } else {
        anims.push(Animated.timing(compactAnim, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }));
      }
      // Search overlay
      if (target.kind === 'searching') {
        anims.push(Animated.timing(searchAnim, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }));
      } else {
        anims.push(Animated.timing(searchAnim, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }));
      }
      // Browse panel
      if (target.kind === 'browse') {
        anims.push(Animated.timing(browseAnim, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }));
      } else {
        anims.push(Animated.timing(browseAnim, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }));
      }

      setStep(target);
      Animated.parallel(anims).start(() => {
        if (target.kind === 'searching') {
          searchRef.current?.focus();
        }
      });
    },
    [compactAnim, searchAnim, browseAnim],
  );

  const openSearch = useCallback(() => {
    setPreviewRide(null);
    animateTo({ kind: 'searching' });
  }, [animateTo]);

  const selectDestination = useCallback(
    (key: string, label: string) => {
      Keyboard.dismiss();
      setQuery('');
      setPreviewRide(null);
      animateTo({ kind: 'browse', destination: key, label });
    },
    [animateTo],
  );

  const goBack = useCallback(() => {
    Keyboard.dismiss();
    setQuery('');
    setPreviewRide(null);
    animateTo({ kind: 'idle' });
  }, [animateTo]);

  // Ride preview animation
  const showPreview = useCallback(
    (ride: Ride) => {
      setPreviewRide(ride);
      Animated.spring(previewAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 }).start();
    },
    [previewAnim],
  );

  const hidePreview = useCallback(() => {
    Animated.timing(previewAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setPreviewRide(null);
    });
  }, [previewAnim]);

  const mapRegion = useMemo(() => {
    if (step.kind === 'browse') {
      return { ...BAGUIO_ZOOMED, latitudeDelta: 0.04, longitudeDelta: 0.04 };
    }
    return BAGUIO_ZOOMED;
  }, [step]);

  const isBrowsing = step.kind === 'browse';

  return (
    <View style={styles.container}>
      {/* ─── Map layer ─── */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        showsUserLocation={false}
        loadingEnabled
        customMapStyle={MAP_STYLE}
        onPress={() => {
          if (previewRide) {
            hidePreview();
          } else if (step.kind === 'browse') {
            goBack();
          }
        }}
      >
        {/* User location dot */}
        <Marker
          coordinate={{ latitude: BAGUIO_CENTER.latitude, longitude: BAGUIO_CENTER.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userDot}>
            <View style={styles.userDotInner} />
          </View>
        </Marker>

        {/* Browse: exact ride car markers */}
        {isBrowsing &&
          exactRides.map((ride) => (
            <Marker
              key={ride.id}
              coordinate={getCoord(ride.from)}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => showPreview(ride)}
            >
              <View style={styles.carMarker}>
                <MaterialCommunityIcons name="car-side" size={22} color={colors.card} />
              </View>
            </Marker>
          ))}

        {/* Browse: on-the-way car markers */}
        {isBrowsing &&
          onTheWayRides.map((ride) => (
            <Marker
              key={ride.id}
              coordinate={getCoord(ride.from)}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => showPreview(ride)}
            >
              <View style={styles.carMarkerOnWay}>
                <MaterialCommunityIcons name="car-side" size={22} color={colors.card} />
              </View>
            </Marker>
          ))}

        {/* Browse: destination marker */}
        {isBrowsing && (
          <Marker coordinate={getCoord(step.destination)} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.destMarker}>
              <MaterialCommunityIcons name="map-marker" size={32} color={colors.danger} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ─── IDLE: bottom panel (animated) ─── */}
      <Animated.View
        style={[
          styles.compactBar,
          { paddingBottom: TAB_BAR_PADDING },
          {
            transform: [
              {
                translateY: compactAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
            opacity: compactAnim,
          },
        ]}
        pointerEvents={step.kind === 'idle' ? 'auto' : 'none'}
      >
        {/* Greeting + ride count */}
        <View style={styles.greetingRow}>
          <View>
            <Text variant="titleMedium" style={styles.greetingText}>
              {getGreeting()}, {currentUser.firstName}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {openRides.length} ride{openRides.length === 1 ? '' : 's'} available nearby
            </Text>
          </View>
          <View style={styles.rideBadge}>
            <MaterialCommunityIcons name="car-multiple" size={16} color={colors.primary} />
            <Text variant="labelMedium" style={styles.rideBadgeText}>
              {openRides.length}
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <Pressable style={styles.fakeSearchRow} onPress={openSearch}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
          <Text variant="bodyLarge" style={styles.fakeSearchText}>
            Where are you heading?
          </Text>
        </Pressable>

        {/* Quick-access destination chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {QUICK_CHIPS.map((dest) => (
            <Pressable
              key={dest.key}
              style={styles.quickChip}
              onPress={() => selectDestination(dest.key, dest.label)}
            >
              <MaterialCommunityIcons name={dest.icon} size={14} color={colors.primary} />
              <Text variant="labelMedium" style={styles.quickChipText}>
                {dest.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Active request banners */}
        {activeRequests.map((req) => (
          <Pressable
            key={req.id}
            style={styles.requestBanner}
            onPress={() => {
              const dest = DESTINATIONS.find((d) => d.key === req.to.toLowerCase());
              if (dest) {
                selectDestination(dest.key, dest.label);
              } else {
                selectDestination(req.to.toLowerCase(), req.to);
              }
            }}
          >
            <View style={styles.requestBannerIcon}>
              <MaterialCommunityIcons name="hand-wave" size={16} color={colors.card} />
            </View>
            <View style={styles.requestBannerText}>
              <Text variant="labelLarge" numberOfLines={1}>
                {req.from} → {req.to}
              </Text>
              <Text variant="bodySmall" style={styles.muted}>
                {formatDepartureTime(req.desiredDepartureTime)} · Waiting for a driver
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </Animated.View>

      {/* ─── SEARCHING: full-screen overlay (animated) ─── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: searchAnim,
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_HEIGHT, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={step.kind === 'searching' ? 'auto' : 'none'}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.searchFull}
        >
          <View style={[styles.searchTopBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable onPress={goBack} hitSlop={8} style={styles.searchBackBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.searchInputWrap}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
              <TextInput
                ref={searchRef}
                style={styles.searchInput}
                placeholder="Where are you heading?"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.searchResults}
            contentContainerStyle={styles.searchResultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {query.trim().length === 0 && (
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Popular destinations
              </Text>
            )}
            {filteredDestinations.map((dest) => (
              <Pressable
                key={dest.key}
                style={styles.destRow}
                onPress={() => selectDestination(dest.key, dest.label)}
              >
                <View style={styles.destIconCircle}>
                  <MaterialCommunityIcons name={dest.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.destTextCol}>
                  <Text variant="bodyLarge">{dest.label}</Text>
                </View>
              </Pressable>
            ))}
            {filteredDestinations.length === 0 && (
              <View style={styles.emptyDest}>
                <Text variant="bodyMedium" style={styles.muted}>
                  No matching destinations
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* ─── BROWSE: ride results panel (animated) ─── */}
      <Animated.View
        style={[
          styles.browsePanel,
          { paddingBottom: TAB_BAR_PADDING },
          {
            transform: [
              {
                translateY: browseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_HEIGHT * 0.6, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isBrowsing ? 'auto' : 'none'}
      >
        <View style={styles.panelHandle} />
        <Text variant="titleMedium" style={styles.browseTitle}>
          Rides to {isBrowsing ? step.label : ''}
        </Text>
        <Text variant="bodySmall" style={styles.muted}>
          {totalResults} ride{totalResults === 1 ? '' : 's'} available
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.rideScroll}
          contentContainerStyle={styles.rideScrollContent}
        >
          {activeRequests.length > 0 && (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Your request
              </Text>
              {activeRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onCancel={() => dispatch({ type: 'CANCEL_REQUEST', requestId: req.id })}
                />
              ))}
            </View>
          )}

          {exactRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onPress={() =>
                router.push({ pathname: '/(rider)/ride-details', params: { id: ride.id } })
              }
            />
          ))}

          {onTheWayRides.length > 0 && (
            <>
              <View style={styles.onTheWayHeader}>
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.warning} />
                <Text variant="labelLarge" style={styles.onTheWayLabel}>
                  On the way
                </Text>
              </View>
              {onTheWayRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onPress={() =>
                    router.push({ pathname: '/(rider)/ride-details', params: { id: ride.id } })
                  }
                />
              ))}
            </>
          )}

          {totalResults === 0 && (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="car-off" size={40} color={colors.muted} />
              <Text variant="titleMedium">No rides to {isBrowsing ? step.label : ''}</Text>
              <Text variant="bodyMedium" style={styles.muted}>
                Post a request and drivers will find you.
              </Text>
            </View>
          )}

          <Button
            mode="contained-tonal"
            icon="plus"
            onPress={() => router.push('/(rider)/post-request')}
            style={styles.postBtn}
          >
            {totalResults === 0 ? 'Post a ride request' : "Can't find a ride? Post a request"}
          </Button>
        </ScrollView>
      </Animated.View>

      {/* Browse back button */}
      {isBrowsing && (
        <IconButton
          icon="arrow-left"
          size={22}
          onPress={goBack}
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
        />
      )}

      {/* ─── Ride preview card (tapping a car marker) ─── */}
      {previewRide && (
        <Animated.View
          style={[
            styles.previewWrap,
            { paddingBottom: step.kind === 'idle' ? TAB_BAR_PADDING + 72 : TAB_BAR_PADDING },
            {
              transform: [
                {
                  translateY: previewAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0],
                  }),
                },
              ],
              opacity: previewAnim,
            },
          ]}
        >
          <RidePreviewCard
            ride={previewRide}
            onViewDetails={() => {
              hidePreview();
              router.push({ pathname: '/(rider)/ride-details', params: { id: previewRide.id } });
            }}
            onClose={hidePreview}
          />
        </Animated.View>
      )}
    </View>
  );
}

/* ─── Ride Preview Card ─── */

function RidePreviewCard({
  ride,
  onViewDetails,
  onClose,
}: {
  ride: Ride;
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const seatsLeft = ride.totalSeats - ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  return (
    <Card style={styles.previewCard} onPress={onViewDetails}>
      <Card.Content style={styles.previewContent}>
        <View style={styles.previewTop}>
          <Avatar uri={ride.driverProfilePicUri} firstName={ride.driverFirstName} size={40} />
          <View style={styles.previewMeta}>
            <View style={styles.previewNameRow}>
              <Text variant="titleMedium">{ride.driverFirstName}</Text>
              {ride.driverVerified ? <VerifiedBadge compact /> : null}
            </View>
            <Text variant="bodySmall" style={styles.muted}>
              {ride.driverRating.toFixed(1)} ★ · {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.previewRoute}>
          <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.primary} />
          <Text variant="bodyMedium" style={styles.previewRouteText}>
            {ride.from} → {ride.to}
          </Text>
        </View>

        <View style={styles.previewDetails}>
          <Text variant="bodySmall" style={styles.muted}>
            {formatDepartureTime(ride.departureTime)} · {ride.distanceKm} km · {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
          </Text>
          <Text variant="titleMedium" style={styles.previewPrice}>
            {formatPHP(ride.pricePerPerson)}
          </Text>
        </View>

        <Button mode="contained" onPress={onViewDetails} style={styles.previewBtn}>
          View Details
        </Button>
      </Card.Content>
    </Card>
  );
}

/* ─── Request Card ─── */

function RequestCard({
  request,
  onCancel,
}: {
  request: RideRequest;
  onCancel: () => void;
}) {
  const when = formatDepartureTime(request.desiredDepartureTime);
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.rowHeader}>
          <View style={styles.rowTitle}>
            <MaterialCommunityIcons name="hand-wave" size={16} color={colors.primary} />
            <Text variant="titleMedium">
              {request.from} → {request.to}
            </Text>
          </View>
          <Chip compact>open</Chip>
        </View>
        <Text variant="bodySmall" style={styles.muted}>
          {when} · {request.distanceKm} km · waiting for a driver
        </Text>
        {request.notes ? (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            "{request.notes}"
          </Text>
        ) : null}
        <Button mode="text" compact onPress={onCancel} style={styles.cancelBtn}>
          Cancel request
        </Button>
      </Card.Content>
    </Card>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1 },

  // User location dot
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(2,136,209,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.card,
  },

  // Car markers
  carMarker: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  carMarkerOnWay: {
    backgroundColor: colors.warning,
    borderRadius: 16,
    padding: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  destMarker: {
    alignItems: 'center',
  },

  // ── Idle: bottom panel ──
  compactBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontWeight: '700',
  },
  rideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F3E8',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rideBadgeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  fakeSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  fakeSearchText: {
    color: colors.muted,
    flex: 1,
  },
  chipScroll: {
    gap: spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  quickChipText: {
    color: colors.text,
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
  },
  requestBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBannerText: {
    flex: 1,
  },

  // ── Searching: full screen ──
  searchFull: {
    flex: 1,
    backgroundColor: colors.card,
  },
  searchTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface,
  },
  searchBackBtn: {
    padding: spacing.xs,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  destIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destTextCol: {
    flex: 1,
  },
  emptyDest: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  // ── Browse ──
  backButton: {
    position: 'absolute',
    left: spacing.sm,
    zIndex: 10,
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  browsePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.55,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  panelHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  browseTitle: { fontWeight: '700' },
  rideScroll: { marginTop: spacing.sm },
  rideScrollContent: { gap: spacing.sm, paddingBottom: spacing.md },

  // On the way
  onTheWayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  onTheWayLabel: { color: colors.warning },

  // ── Ride preview card ──
  previewWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  previewContent: { gap: spacing.sm },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewMeta: { flex: 1 },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewRouteText: { fontWeight: '600' },
  previewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewPrice: { color: colors.primary, fontWeight: '700' },
  previewBtn: { borderRadius: 10 },

  // ── Shared ──
  muted: { color: colors.muted },
  notes: { color: colors.muted, fontStyle: 'italic', marginTop: spacing.xs },
  card: { backgroundColor: colors.card },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  cancelBtn: { alignSelf: 'flex-end', marginTop: spacing.xs },
  postBtn: { marginTop: spacing.xs },
  section: { gap: spacing.xs },
  sectionLabel: { color: colors.muted, marginTop: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
});
