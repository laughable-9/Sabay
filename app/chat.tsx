import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { colors, spacing } from '../constants/theme';
import type { ChatMessage, DriverStatus } from '../utils/types';

const STATUS_COPY: Record<DriverStatus, { label: string; color: string; icon: 'clock-outline' | 'car' | 'map-marker-check' }> = {
  preparing: { label: 'Preparing to leave', color: colors.muted, icon: 'clock-outline' },
  enroute: { label: 'On the way', color: colors.primary, icon: 'car' },
  arrived: { label: 'Arrived', color: colors.success, icon: 'map-marker-check' },
};

// Demo auto-advance timings: driver sends an initial greeting, then starts the
// trip after this delay so a single-device demo doesn't require manual role
// switching to see the map animation.
const AUTO_GREETING_DELAY_MS = 1500;
const AUTO_START_DELAY_MS = 5000;

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const ride = state.rides.find((r) => r.id === id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const autoGreetedRef = useRef(false);
  const autoStartedRef = useRef(false);

  const isDriver = useMemo(
    () => !!ride && ride.driverId === currentUser.id,
    [ride, currentUser.id],
  );

  // Demo auto-advance: if the user is viewing as a rider and the ride has at
  // least one passenger, simulate the driver replying and starting the trip.
  useEffect(() => {
    if (!ride) return;
    if (isDriver) return;
    if (ride.driverStatus !== 'preparing') return;
    if (ride.passengers.length === 0) return;

    let greetTimer: ReturnType<typeof setTimeout> | undefined;
    let startTimer: ReturnType<typeof setTimeout> | undefined;

    if (!autoGreetedRef.current) {
      autoGreetedRef.current = true;
      greetTimer = setTimeout(() => {
        dispatch({
          type: 'SEND_MESSAGE',
          rideId: ride.id,
          message: {
            id: `m_auto_${Date.now()}`,
            senderId: ride.driverId,
            senderFirstName: ride.driverFirstName,
            senderProfilePicUri: ride.driverProfilePicUri,
            text: "Hey! I'll be heading out in a bit. See you at the pickup 👋",
            sentAt: Date.now(),
          },
        });
      }, AUTO_GREETING_DELAY_MS);
    }

    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      startTimer = setTimeout(() => {
        dispatch({
          type: 'SEND_MESSAGE',
          rideId: ride.id,
          message: {
            id: `m_auto_start_${Date.now()}`,
            senderId: ride.driverId,
            senderFirstName: ride.driverFirstName,
            senderProfilePicUri: ride.driverProfilePicUri,
            text: "On my way now 🚗",
            sentAt: Date.now(),
          },
        });
        dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'enroute' });
      }, AUTO_START_DELAY_MS);
    }

    return () => {
      if (greetTimer) clearTimeout(greetTimer);
      if (startTimer) clearTimeout(startTimer);
    };
  }, [ride?.id, ride?.driverStatus, ride?.passengers.length, isDriver]);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const statusCopy = STATUS_COPY[ride.driverStatus];

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    const message: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: currentUser.id,
      senderFirstName: currentUser.firstName,
      senderProfilePicUri: currentUser.profilePicUri,
      text,
      sentAt: Date.now(),
    };
    dispatch({ type: 'SEND_MESSAGE', rideId: ride.id, message });
    setDraft('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onStartTrip = () => {
    dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'enroute' });
  };

  const onOpenTracking = () => {
    if (isDriver) {
      router.push({ pathname: '/(driver)/active-ride', params: { id: ride.id } });
    } else {
      router.push('/(rider)/active-ride');
    }
  };

  const headline = isDriver
    ? ride.passengers.length === 0
      ? 'Waiting for riders'
      : `${ride.passengers.length} rider${ride.passengers.length === 1 ? '' : 's'} joined`
    : ride.driverFirstName;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${ride.from} → ${ride.to}`,
          headerRight: () => (
            <View style={styles.statusPill}>
              <MaterialCommunityIcons
                name={statusCopy.icon}
                size={14}
                color={statusCopy.color}
              />
              <Text variant="labelSmall" style={{ color: statusCopy.color }}>
                {statusCopy.label}
              </Text>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerRow}>
          <Avatar
            uri={isDriver ? undefined : ride.driverProfilePicUri}
            firstName={isDriver ? 'Group' : ride.driverFirstName}
            size={36}
          />
          <Text variant="titleMedium" style={styles.headline}>
            {headline}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={ride.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text variant="bodyMedium" style={styles.muted}>
                No messages yet — say hi to your carpool.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageRow message={item} mine={item.senderId === currentUser.id} />
          )}
        />

        {ride.driverStatus === 'enroute' ? (
          <Pressable style={styles.ctaBanner} onPress={onOpenTracking}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>Open live tracking</Text>
          </Pressable>
        ) : isDriver ? (
          <Pressable style={styles.ctaBanner} onPress={onStartTrip}>
            <MaterialCommunityIcons name="car" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>I'm on my way</Text>
          </Pressable>
        ) : null}

        <View style={styles.inputRow}>
          <RNTextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            style={styles.input}
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim()}
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function MessageRow({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const time = new Date(message.sentAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
      {!mine ? (
        <Avatar
          uri={message.senderProfilePicUri}
          firstName={message.senderFirstName}
          size={24}
        />
      ) : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {!mine ? (
          <Text variant="labelSmall" style={styles.senderName}>
            {message.senderFirstName}
          </Text>
        ) : null}
        <Text style={mine ? styles.textMine : styles.textOther}>{message.text}</Text>
        <Text
          variant="labelSmall"
          style={[styles.time, mine ? styles.timeMine : styles.timeOther]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  headline: {
    fontWeight: '600',
  },
  messages: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: '85%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    flexShrink: 1,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: colors.muted,
    marginBottom: 2,
  },
  textMine: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  textOther: {
    color: colors.text,
    fontSize: 15,
  },
  time: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 10,
  },
  timeMine: {
    color: '#E6F3E8',
  },
  timeOther: {
    color: colors.muted,
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 20,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  muted: {
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
