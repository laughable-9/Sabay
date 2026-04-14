import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../../components/Avatar';
import { colors, spacing } from '../../constants/theme';

const HEADER_OFFSET = Platform.OS === 'ios' ? 96 : 0;

export default function Signup() {
  const { currentUser, dispatch } = useApp();
  const [name, setName] = useState(currentUser.firstName);
  const [phone, setPhone] = useState(currentUser.phone ?? '');
  const [email, setEmail] = useState('');
  const [pickedUri, setPickedUri] = useState<string | undefined>(currentUser.profilePicUri);

  const onPickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPickedUri(uri);
      dispatch({ type: 'SET_PROFILE_PIC', uri });
    }
  };

  const onContinue = (nextHref: '/verify-rider' | '/verify-driver') => {
    dispatch({
      type: 'SET_USER_PROFILE',
      updates: {
        firstName: name.split(' ')[0] || currentUser.firstName,
        phone: phone.trim() || undefined,
      },
    });
    dispatch({
      type: 'SET_ROLE',
      role: nextHref === '/verify-rider' ? 'rider' : 'driver',
    });
    router.push(nextHref);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sign Up' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={HEADER_OFFSET}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMedium" style={styles.intro}>
            Demo signup — tap the circle to add a photo; other fields are shells for the prototype.
          </Text>

          <View style={styles.avatarSection}>
            <Pressable onPress={onPickPhoto} style={styles.avatarPressable}>
              <Avatar uri={pickedUri} firstName={name || 'Kyle'} size={112} />
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text variant="bodySmall" style={styles.muted}>
              Tap to add profile photo (optional)
            </Text>
          </View>

          <TextInput label="Full name" value={name} onChangeText={setName} mode="outlined" />

          <View>
            <TextInput
              label="Phone number (also your GCash)"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="09XX XXX XXXX"
            />
            <HelperText type="info" visible>
              Riders send the fare share to this number via GCash.
            </HelperText>
          </View>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.actions}>
            <Button mode="contained" onPress={() => onContinue('/verify-rider')}>
              Continue as Rider
            </Button>
            <Button mode="outlined" onPress={() => onContinue('/verify-driver')}>
              Continue as Driver
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  intro: {
    color: colors.muted,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  avatarPressable: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  muted: {
    color: colors.muted,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
