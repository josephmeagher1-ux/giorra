import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getProfile, updateProfile } from '@/lib/api';
import { updateProfileSchema } from '@giorra/shared';
import { theme } from '@/lib/theme';

export default function EditProfileScreen() {
  const profile = getProfile();
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = updateProfileSchema.safeParse({
      full_name: fullName,
      bio: bio || undefined,
      phone: phone || undefined,
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      Alert.alert('Validation error', `${firstError.path.join('.')}: ${firstError.message}`);
      return;
    }
    setSaving(true);
    await updateProfile(parsed.data);
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Edit profile</Heading>

      <Card style={{ gap: theme.spacing(3) }}>
        <Input
          label="Display name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
        />
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="A short description (optional)"
          multiline
          maxLength={500}
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+353..."
          keyboardType="phone-pad"
        />
        <Caption>Phone is optional but helps drivers and riders reach you if the app is offline.</Caption>
      </Card>

      <Button title="Save changes" full loading={saving} onPress={onSave} />
    </Screen>
  );
}
