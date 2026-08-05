import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type AvatarPresetId =
  | 'initials'
  | 'leaf'
  | 'seed'
  | 'sun'
  | 'wave'
  | 'mountain'
  | 'bird'
  | 'heart'
  | 'star';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  icon: IconName;
  color: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'initials', label: 'Initiales', icon: 'person-outline', color: '#2F6B4F' },
  { id: 'leaf', label: 'Feuille', icon: 'leaf', color: '#2F6B4F' },
  { id: 'seed', label: 'Graine', icon: 'nutrition', color: '#C4892A' },
  { id: 'sun', label: 'Soleil', icon: 'sunny', color: '#C4892A' },
  { id: 'wave', label: 'Vague', icon: 'water', color: '#3D6B8A' },
  { id: 'mountain', label: 'Montagne', icon: 'triangle', color: '#8A5A3D' },
  { id: 'bird', label: 'Oiseau', icon: 'paper-plane', color: '#3F8A64' },
  { id: 'heart', label: 'Cœur', icon: 'heart', color: '#B5453A' },
  { id: 'star', label: 'Étoile', icon: 'star', color: '#6B4F8A' },
];

export function getAvatarPreset(id: string | null | undefined): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}
