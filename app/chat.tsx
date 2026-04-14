import { useMemo, useRef, useState } from 'react';
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
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { colors, spacing } from '../constants/theme';
import type { ChatMessage, DriverStatus } from '../utils/types';

const STATUS_COPY: Record<DriverStatus, { label: string; color: string }> = {
  preparing: { label: 'Driver is preparing to leave', color: colors.muted },
  enroute: { label: 'Driver is on the way', color: colors.primary },
  arrived: { label: 'Driver has arrived', color: colors.success },
};

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const ride = state.rides.find((r) => r.id === id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isDriver = useMemo(
    () => !!ride && ride.driverId === currentUser.id,
    [ride, currentUser.id],
  );

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

  return (
    <>
      <Stack.Screen
        options={{
          title: `${ride.from} → ${ride.to}`,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <Avatar
            uri={isDriver ? undefined : ride.driverProfilePicUri}
            firstName={isDriver ? 'Group' : ride.driverFirstName}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
              <Text variant="titleSmall">
                {isDriver ? 'Group chat' : ride.driverFirstName}
              </Text>
              {!isDriver && ride.driverVerified ? <VerifiedBadge compact /> : null}
            </View>
            <Text variant="bodySmall" style={[styles.statusLine, { color: statusCopy.color }]}>
              {statusCopy.label}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={ride.driverStatus === 'enroute' ? 'car' : 'clock-outline'}
            size={22}
            color={statusCopy.color}
          />
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
          <View style={styles.driverCta}>
            <Button mode="contained" icon="car" onPress={onStartTrip}>
              I'm on my way
            </Button>
          </View>
        ) : (
          <View style={styles.waitingNote}>
            <Text variant="bodySmall" style={styles.muted}>
              Live tracking will open when the driver starts the trip.
            </Text>
          </View>
        )}

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
          size={28}
        />
      ) : null}
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        {!mine ? (
          <Text variant="labelSmall" style={styles.senderName}>
            {message.senderFirstName}
          </Text>
        ) : null}
        <Text style={mine ? styles.textMine : styles.textOther}>{message.text}</Text>
        <Text variant="labelSmall" style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusLine: {
    marginTop: 2,
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
    borderRadius: 16,
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
  },
  textOther: {
    color: colors.text,
  },
  time: {
    marginTop: 4,
    alignSelf: 'flex-end',
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
  },
  driverCta: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  waitingNote: {
    padding: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
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
