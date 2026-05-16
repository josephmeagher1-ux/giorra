import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { searchPlaces, type GeocodingResult } from '@/lib/geocoding';
import { theme } from '@/lib/theme';

interface Props {
  label: string;
  value: GeocodingResult | null;
  onSelect: (result: GeocodingResult) => void;
  placeholder?: string;
  icon?: 'circle' | 'map-pin';
  iconColor?: string;
}

export function LocationInput({ label, value, onSelect, placeholder, icon = 'circle', iconColor = theme.colors.accent }: Props) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const hits = await searchPlaces(text);
      setResults(hits);
      setShowDropdown(hits.length > 0);
    }, 300);
  }, []);

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.name);
    setShowDropdown(false);
    setResults([]);
    onSelect(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Feather name={icon} size={14} color={iconColor} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={query}
            onChangeText={handleChange}
            placeholder={placeholder ?? 'Search location...'}
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
        </View>
        {value && (
          <View style={styles.checkmark}>
            <Feather name="check" size={12} color={theme.colors.accent} />
          </View>
        )}
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <Pressable
              key={`${r.lat}-${r.lng}-${i}`}
              style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
              onPress={() => handleSelect(r)}
            >
              <Feather name="map-pin" size={12} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{r.name}</Text>
                <Text style={styles.resultDetail} numberOfLines={1}>{r.display_name}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = {
  container: { position: 'relative' as const, zIndex: 10 },
  inputRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 6 },
  label: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6, fontWeight: '600' as const },
  input: {
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 2,
    paddingHorizontal: 0,
    ...((Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object),
  } as any,
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }),
  },
  dropdownItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemPressed: { backgroundColor: theme.colors.bg },
  resultName: { fontSize: 14, fontWeight: '600' as const, color: theme.colors.text },
  resultDetail: { fontSize: 11, color: theme.colors.textMuted },
};
