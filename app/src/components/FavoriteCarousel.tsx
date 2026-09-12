import * as React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Image } from 'expo-image';
import type { CollectionItem } from '../services/valuation';

export function FavoriteCarousel({ items }: { items: CollectionItem[] }) {
  if (items.length === 0) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Nenhuma favorita ainda — toque na estrela para destacar</Text>
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(it) => it.code}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={{ marginRight: 12, alignItems: 'center' }}>
          <Image source={{ uri: item.imageLocalPath ?? item.imageUrl }} style={{ width: 120, height: 175, borderRadius: 8 }} contentFit="cover" />
          <Text numberOfLines={1} style={{ fontSize: 12, maxWidth: 120 }}>{item.name}</Text>
        </View>
      )}
    />
  );
}
