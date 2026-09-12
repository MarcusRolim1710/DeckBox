import * as React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { normalizeCode } from '../lib/validators';
import { ValidationError, NotFoundError, NetworkError } from '../lib/errors';
import { fetchByCode } from '../services/cardApi';
import { getRate, deriveBRL } from '../services/exchangeApi';
import { formatDual } from '../lib/formatters';
import { useCollectionStore } from '../store/collectionStore';

export default function NovaCartaScreen() {
  const [raw, setRaw] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<{ name: string; imageUrl: string; priceUSD: number | null; priceBRL: number | null } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const { addByCode } = useCollectionStore();

  const onSearch = async () => {
    setError(null);
    setPreview(null);
    try {
      const code = normalizeCode(raw);
      setLoading(true);
      const card = await fetchByCode(code);
      const { rate } = await getRate().catch(() => ({ rate: null as any }));
      const priceBRL = deriveBRL(card.priceUSD, rate);
      setPreview({ name: card.name, imageUrl: card.imageUrl, priceUSD: card.priceUSD, priceBRL });
    } catch (e: any) {
      if (e instanceof ValidationError) setError(e.message);
      else if (e instanceof NotFoundError) setError('Código não encontrado');
      else if (e instanceof NetworkError) setError('Sem conexão — Tentar novamente');
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!preview) return;
    if (saving) return; // idempotência
    setSaving(true);
    try {
      const code = normalizeCode(raw);
      await addByCode(code);
      setRaw('');
      setPreview(null);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Código da carta (ex.: LOB-001)</Text>
      <TextInput value={raw} onChangeText={setRaw} placeholder="LOB-001" autoCapitalize="characters" style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />
      <Pressable onPress={onSearch} style={{ marginTop: 12, backgroundColor: '#0f172a', padding: 12, borderRadius: 8, alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Buscar</Text>
      </Pressable>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text>}
      {preview && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Image source={{ uri: preview.imageUrl }} style={{ width: 180, height: 260, borderRadius: 8 }} contentFit="cover" />
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>{preview.name}</Text>
          <Text>{formatDual(preview.priceUSD, preview.priceBRL)}</Text>
          {preview.priceUSD == null && <Text style={{ color: '#b45309' }}>Preço indisponível — não entra na soma</Text>}
          <Pressable onPress={onConfirm} disabled={saving} style={{ marginTop: 12, backgroundColor: saving ? '#64748b' : '#16a34a', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' }}>
            <Text style={{ color: 'white' }}>{saving ? 'Salvando...' : 'Confirmar e salvar'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
