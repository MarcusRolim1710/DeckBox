import * as React from 'react';
import { View, Text, Pressable } from 'react-native';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 16, marginBottom: 12 }}>Sua coleção está vazia</Text>
      <Pressable onPress={onAdd} style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Adicionar primeira carta</Text>
      </Pressable>
    </View>
  );
}
