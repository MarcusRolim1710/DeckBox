import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

export function CardTile({
  code,
  name,
  imageUrl,
  imageLocalPath,
  quantity,
  isFavorite,
  onToggleFavorite,
  onPress,
}: {
  code?: string;
  name: string;
  imageUrl: string;
  imageLocalPath: string | null;
  quantity: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}) {
  const uri = imageLocalPath ?? imageUrl;
  const [failed, setFailed] = React.useState(false);
  return (
    <Pressable onPress={onPress} style={{ width: '32%', margin: 2, alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        {!failed && uri ? (
          <Image
            source={{ uri }}
            style={{ width: 110, height: 160, borderRadius: 6 }}
            contentFit="cover"
            transition={200}
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={{ width: 110, height: 160, borderRadius: 6, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
            <Text style={{ fontSize: 10, textAlign: 'center' }}>{name}{code ? `\n${code}` : ''}</Text>
          </View>
        )}
        {quantity > 1 && (
          <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'black', borderRadius: 10, paddingHorizontal: 6 }}>
            <Text style={{ color: 'white', fontSize: 12 }}>x{quantity}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={{ fontSize: 12, marginTop: 4 }}>{name}</Text>
      <Pressable onPress={onToggleFavorite} hitSlop={8} style={{ padding: 4 }}>
        <Text accessibilityLabel={isFavorite ? 'Remover favorito' : 'Favoritar'}>{isFavorite ? '★' : '☆'}</Text>
      </Pressable>
    </Pressable>
  );
}
