import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AVATAR_PRESETS, getAvatarPreset } from '../lib/avatars';
import { colors, fonts, radius } from '../theme/colors';
import { TOUCH } from '../hooks/useLayout';
import { Avatar, Body, Button, Eyebrow } from './primitives';

const PHOTO_MAX_CHARS = 700_000;

export type AvatarChoice = {
  preset: string;
  photo: string | null;
};

async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission', 'Autorise l’accès aux photos pour choisir une image de profil.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.55,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return assetToDataUri(result.assets[0]);
}

async function pickFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission', 'Autorise la caméra pour prendre une photo de profil.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.55,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return assetToDataUri(result.assets[0]);
}

function assetToDataUri(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    const uri = `data:${mime};base64,${asset.base64}`;
    if (uri.length > PHOTO_MAX_CHARS) {
      Alert.alert('Photo trop lourde', 'Choisis une image plus légère (recadrage serré, qualité moyenne).');
      return null;
    }
    return uri;
  }
  if (asset.uri) return asset.uri;
  return null;
}

export function AvatarPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: AvatarChoice;
  onChange: (next: AvatarChoice) => void;
}) {
  async function usePhoto(from: 'library' | 'camera') {
    const uri = from === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (!uri) return;
    onChange({ preset: value.preset || 'initials', photo: uri });
  }

  function pickPreset(id: string) {
    onChange({ preset: id, photo: null });
  }

  function clearPhoto() {
    onChange({ preset: value.preset || 'initials', photo: null });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.preview}>
        <Avatar
          name={name || 'Toi'}
          size={88}
          preset={value.preset}
          photoUri={value.photo}
        />
        <Body style={{ marginTop: 10, textAlign: 'center' }}>
          {value.photo ? 'Photo de profil' : getAvatarPreset(value.preset).label}
        </Body>
      </View>

      <Eyebrow>Avatars</Eyebrow>
      <View style={styles.grid}>
        {AVATAR_PRESETS.map((p) => {
          const active = !value.photo && value.preset === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => pickPreset(p.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Avatar ${p.label}`}
              style={({ pressed }) => [
                styles.preset,
                active && styles.presetOn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.presetCircle, { backgroundColor: p.color }]}>
                {p.id === 'initials' ? (
                  <Text style={styles.presetInitials}>{(name || 'S').slice(0, 1).toUpperCase()}</Text>
                ) : (
                  <Ionicons name={p.icon} size={20} color={colors.white} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Eyebrow>Photo</Eyebrow>
      <View style={styles.photoActions}>
        <View style={styles.photoBtn}>
          <Button
            label="Galerie"
            icon="images-outline"
            variant="soft"
            compact
            onPress={() => void usePhoto('library')}
          />
        </View>
        <View style={styles.photoBtn}>
          <Button
            label="Caméra"
            icon="camera-outline"
            variant="ghost"
            compact
            onPress={() => void usePhoto('camera')}
          />
        </View>
      </View>
      {value.photo ? (
        <Button label="Retirer la photo" variant="ghost" icon="close-outline" onPress={clearPhoto} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  preview: {
    alignItems: 'center',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  preset: {
    width: TOUCH + 4,
    height: TOUCH + 4,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetOn: {
    borderColor: colors.or,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInitials: {
    fontFamily: fonts.corpsBold,
    color: colors.white,
    fontSize: 16,
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  photoBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 130,
  },
});
