import * as React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useCollectionStore } from '../store/collectionStore';
import { computeTotals } from '../services/valuation';
import { formatBRL, formatUSD } from '../lib/formatters';
import * as repo from '../services/collectionRepo';

export default function ValoresScreen() {
  const { items, loadAll } = useCollectionStore();
  const [syncing, setSyncing] = React.useState(false);
  const { totalValueBRL, totalValueUSD, itemsWithoutPrice, breakdown } = computeTotals(items);
  const isStale = items.some((it) => it.exchangeRateDate && it.exchangeRateDate < new Date().toISOString().slice(0, 10));

  const onSync = async () => {
    setSyncing(true);
    await repo.resyncPrices().catch(() => {});
    await loadAll();
    setSyncing(false);
  };

  if (items.length === 0) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Sua coleção ainda não tem valor — adicione cartas</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{formatBRL(totalValueBRL)} (principal)</Text>
      <Text style={{ color: '#555' }}>{formatUSD(totalValueUSD)} (referência)</Text>
      {itemsWithoutPrice > 0 && <Text style={{ color: '#b45309', marginTop: 8 }}>{itemsWithoutPrice} carta(s) sem preço — não entram na soma</Text>}
      {isStale && <Text style={{ color: '#b45309' }}>Cotação desatualizada</Text>}
      <Pressable onPress={onSync} style={{ marginTop: 12, backgroundColor: '#0f172a', padding: 10, borderRadius: 8, alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>{syncing ? 'Atualizando...' : 'Atualizar valores'}</Text>
      </Pressable>
      <View style={{ marginTop: 16 }}>
        {breakdown.map((b) => (
          <View key={b.code} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5 }}>
            <Text style={{ flex: 1 }}>{b.name} ({b.code}) x{b.quantity}</Text>
            <Text>{b.priceBRL != null ? `${formatBRL(b.subtotalBRL!)} (${formatUSD(b.subtotalUSD!)})` : '—'}</Text>
          </View>
        ))}
      </View>
      {syncing && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );
}
