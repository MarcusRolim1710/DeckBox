import * as React from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as repo from '../services/collectionRepo';
import { formatDual } from '../lib/formatters';
import { useCollectionStore } from '../store/collectionStore';
import type { CollectionItem } from '../services/valuation';

export default function CardDetailScreen() {
  const route: any = useRoute();
  const nav: any = useNavigation();
  const { loadAll } = useCollectionStore();
  const [item, setItem] = React.useState<CollectionItem | null>(null);
  const [qty, setQty] = React.useState('1');

  React.useEffect(() => {
    repo.getByCode(route.params.code).then((it) => {
      setItem(it as any);
      if (it) setQty(String(it.quantity));
    });
  }, [route.params.code]);

  if (!item) return <View style={{ padding: 16 }}><Text>Carregando...</Text></View>;

  const onToggle = async () => {
    await repo.toggleFavorite(item.code);
    await loadAll();
    const updated = await repo.getByCode(item.code);
    setItem(updated as any);
  };

  const onSaveQty = async () => {
    const n = parseInt(qty, 10);
    try {
      await repo.updateQuantity(item.code, n);
      await loadAll();
      const updated = await repo.getByCode(item.code);
      setItem(updated as any);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const onRemove = () => {
    Alert.alert(`Remover ${item.name}?`, 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await repo.remove(item.code);
          await loadAll();
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <Image source={{ uri: item.imageLocalPath ?? item.imageUrl }} style={{ width: 200, height: 290, alignSelf: 'center', borderRadius: 8 }} contentFit="cover" />
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginTop: 12 }}>{item.name} ({item.code})</Text>
      <Text>{formatDual(item.currentPriceUSD, item.currentPriceBRL)}</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>Adquirido por: {item.priceAtAcquisitionUSD != null ? formatDual(item.priceAtAcquisitionUSD, null) : '—'} | Sync: {item.lastPriceSyncAt ?? '—'}</Text>
      <Pressable onPress={onToggle} style={{ marginTop: 12, padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' }}>
        <Text>{item.isFavorite ? '★ Remover dos favoritos' : '☆ Adicionar aos favoritos'}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <Text>Quantidade: </Text>
        <TextInput value={qty} onChangeText={setQty} keyboardType="number-pad" style={{ borderWidth: 1, padding: 6, width: 60, borderRadius: 6, textAlign: 'center' }} />
        <Pressable onPress={onSaveQty} style={{ marginLeft: 8, backgroundColor: '#0f172a', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Salvar</Text>
        </Pressable>
      </View>
      <Pressable onPress={onRemove} style={{ marginTop: 24, backgroundColor: '#dc2626', padding: 12, borderRadius: 8, alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Remover da coleção</Text>
      </Pressable>
    </View>
  );
}
