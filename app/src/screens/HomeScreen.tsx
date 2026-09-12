import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useCollectionStore } from '../store/collectionStore';
import { FavoriteCarousel } from '../components/FavoriteCarousel';
import { CardTile } from '../components/CardTile';
import { EmptyState } from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { items, favorites, loading, loadAll, toggleFavorite } = useCollectionStore();
  const nav: any = useNavigation();

  React.useEffect(() => {
    loadAll();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (items.length === 0) return <EmptyState onAdd={() => nav.navigate('NovaCarta')} />;

  return (
    <View style={{ flex: 1, padding: 8 }}>
      <FavoriteCarousel items={favorites} />
      <Text style={{ fontWeight: 'bold', marginVertical: 8 }}>Álbum</Text>
      <FlashList
        data={items}
        numColumns={3}
        renderItem={({ item }) => (
          <CardTile
            code={item.code}
            name={item.name}
            imageUrl={item.imageUrl}
            imageLocalPath={item.imageLocalPath}
            quantity={item.quantity}
            isFavorite={item.isFavorite}
            onToggleFavorite={() => toggleFavorite(item.code)}
            onPress={() => nav.navigate('CardDetail', { code: item.code })}
          />
        )}
        keyExtractor={(it) => it.code}
      />
    </View>
  );
}
