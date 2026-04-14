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
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { colors, spacing } from '../constants/theme';
import type { ChatMessage, DriverStatus, Passenger } from '../utils/types';

type StatusCopy = { label: string; color: string; icon: 'clock-outline' | 'car' | 'map-marker-check' | 'map-marker-radius' };

const STATUS_COPY: Record<DriverStatus, StatusCopy> = {
  preparing: { label: 'Preparing to leave', color: colors.muted, icon: 'clock-outline' },
  to_pickup: { label: 'Heading to pickup', color: colors.primary, icon: 'car' },
  at_pickup: { label: 'Arrived at pickup', color: colors.warning, icon: 'map-marker-radius' },
  to_destination: { label: 'En route', color: colors.primary, icon: 'car' },
  arrived: { label: 'Arrived', color: colors.success, icon: 'map-marker-check' },
};

const AUTO_GREETING_DELAY_MS = 1500;
const AUTO_JOIN_DELAY_MS = 3000;
const AUTO_JOIN_MESSAGE_DELAY_MS = 4200;
const AUTO_START_DELAY_MS = 6500;

const AUTO_PASSENGERS: Array<{
  userId: string;
  firstName: string;
  profilePicUri: string;
  message: string;
}> = [
  {
    userId: 'u_rico',
    firstName: 'Rico',
    profilePicUri:
      'https://ui-avatars.com/api/?name=Rico&background=7C3AED&color=fff&bold=true&size=256',
    message: 'Hey! I just joined. Thanks for the ride.',
  },
];

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const ride = state.rides.find((r) => r.id === id);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isDriver = useMemo(
    () => !!ride && ride.driverId === currentUser.id,
    [ride, currentUser.id],
  );

  const canLeave = ride?.driverStatus === 'preparing' && !isDriver;
  const chatLocked = ride?.driverStatus === 'to_destination' || ride?.driverStatus === 'arrived';

  useEffect(() => {
    if (!ride) return;
    if (isDriver) return;
    if (ride.driverStatus !== 'preparing') return;
    if (ride.passengers.length === 0) return;

    const rideId = ride.id;
    const driverId = ride.driverId;
    const driverFirstName = ride.driverFirstName;
    const driverProfilePicUri = ride.driverProfilePicUri;
    const canAutoJoin = ride.totalSeats - ride.passengers.length > 0;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(
      setTimeout(() => {
        dispatch({
          type: 'SEND_MESSAGE',
          rideId,
          message: {
            id: `m_auto_greet_${Date.now()}`,
            senderId: driverId,
            senderFirstName: driverFirstName,
            senderProfilePicUri: driverProfilePicUri,
            text: "Hey! I'll be heading out in a bit. See you at the pickup 👋",
            sentAt: Date.now(),
          },
        });
      }, AUTO_GREETING_DELAY_MS),
    );

    if (canAutoJoin) {
      const joiner = AUTO_PASSENGERS[0];
      timers.push(
        setTimeout(() => {
          const newPassenger: Passenger = {
            id: `p_auto_${Date.now()}`,
            userId: joiner.userId,
            firstName: joiner.firstName,
            verified: true,
            status: 'waiting',
            joinedAt: Date.now(),
            profilePicUri: joiner.profilePicUri,
          };
          dispatch({ type: 'JOIN_RIDE', rideId, passenger: newPassenger });
          dispatch({
            type: 'SEND_MESSAGE',
            rideId,
            message: {
              id: `m_sys_join_${Date.now()}`,
              senderId: 'system',
              senderFirstName: 'System',
              text: `${joiner.firstName} joined the ride`,
              sentAt: Date.now(),
              isSystem: true,
            },
          });
        }, AUTO_JOIN_DELAY_MS),
      );
      timers.push(
        setTimeout(() => {
          dispatch({
            type: 'SEND_MESSAGE',
            rideId,
            message: {
              id: `m_auto_join_msg_${Date.now()}`,
              senderId: joiner.userId,
              senderFirstName: joiner.firstName,
              senderProfilePicUri: joiner.profilePicUri,
              text: joiner.message,
              sentAt: Date.now(),
            },
          });
        }, AUTO_JOIN_MESSAGE_DELAY_MS),
      );
    }

    timers.push(
      setTimeout(() => {
        dispatch({
          type: 'SEND_MESSAGE',
          rideId,
          message: {
            id: `m_auto_start_${Date.now()}`,
            senderId: driverId,
            senderFirstName: driverFirstName,
            senderProfilePicUri: driverProfilePicUri,
            text: 'On my way now 🚗',
            sentAt: Date.now(),
          },
        });
        dispatch({ type: 'SET_DRIVER_STATUS', rideId, status: 'to_pickup' });
      }, AUTO_START_DELAY_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, isDriver]);

  useEffect(() => {
    if (chatLocked && ride) {
      router.replace('/(rider)/active-ride');
    }
  }, [chatLocked, ride]);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const statusCopy = STATUS_COPY[ride.driverStatus] ?? STATUS_COPY.preparing;

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    dispatch({
      type: 'SEND_MESSAGE',
      rideId: ride.id,
      message: {
        id: `m_${Date.now()}`,
        senderId: currentUser.id,
        senderFirstName: currentUser.firstName,
        senderProfilePicUri: currentUser.profilePicUri,
        text,
        sentAt: Date.now(),
      },
    });
    setDraft('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onStartTrip = () => {
    dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'to_pickup' });
  };

  const onOpenTracking = () => {
    if (isDriver) {
      router.replace({ pathname: '/(driver)/active-ride', params: { id: ride.id } });
    } else {
      router.replace('/(rider)/active-ride');
    }
  };

  const confirmLeave = () => {
    dispatch({
      type: 'SEND_MESSAGE',
      rideId: ride.id,
      message: {
        id: `m_sys_leave_${Date.now()}`,
        senderId: 'system',
        senderFirstName: 'System',
        text: `${currentUser.firstName} left the ride`,
        sentAt: Date.now(),
        isSystem: true,
      },
    });
    dispatch({ type: 'LEAVE_RIDE', rideId: ride.id, userId: currentUser.id });
    setLeaveOpen(false);
    router.replace('/(tabs)');
  };

  const headline = isDriver
    ? ride.passengers.length === 0
      ? 'Waiting for riders'
      : `${ride.passengers.length} rider${ride.passengers.length === 1 ? '' : 's'} joined`
    : ride.driverFirstName;

  const showEnrouteCta = ride.driverStatus === 'to_pickup' || ride.driverStatus === 'at_pickup';

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
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.headline}>
              {headline}
            </Text>
          </View>
          {canLeave ? (
            <Button mode="text" compact onPress={() => setLeaveOpen(true)}>
              Leave
            </Button>
          ) : null}
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
          renderItem={({ item }) =>
            item.isSystem ? (
              <SystemPill message={item} />
            ) : (
              <MessageRow message={item} mine={item.senderId === currentUser.id} />
            )
          }
        />

        {showEnrouteCta ? (
          <Pressable style={styles.ctaBanner} onPress={onOpenTracking}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>Open live tracking</Text>
          </Pressable>
        ) : isDriver && ride.driverStatus === 'preparing' ? (
          <Pressable style={styles.ctaBanner} onPress={onStartTrip}>
            <MaterialCommunityIcons name="car" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>I'm on my way</Text>
          </Pressable>
        ) : null}

        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(spacing.sm, insets.bottom + spacing.xs) },
          ]}
        >
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

      <Portal>
        <Dialog visible={leaveOpen} onDismiss={() => setLeaveOpen(false)}>
          <Dialog.Title>Leave this ride?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You can leave freely while the driver hasn't left yet. Once they're on the
              way, you're committed to the trip.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLeaveOpen(false)}>Stay</Button>
            <Button mode="contained" onPress={confirmLeave}>
              Leave
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function SystemPill({ message }: { message: ChatMessage }) {
  return (
    <View style={styles.systemRow}>
      <View style={styles.systemPill}>
        <Text variant="labelSmall" style={styles.systemText}>
          {message.text}
        </Text>
      </View>
    </View>
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
        <Avatar uri={message.senderProfilePicUri} firstName={message.senderFirstName} size={24} />
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
  systemRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  systemPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  systemText: {
    color: colors.muted,
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
