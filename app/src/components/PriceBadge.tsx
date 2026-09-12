import * as React from 'react';
import { Text } from 'react-native';
import { formatDual } from '../lib/formatters';

export function PriceBadge({ priceUSD, priceBRL }: { priceUSD: number | null; priceBRL: number | null }) {
  return <Text>{formatDual(priceUSD, priceBRL)}</Text>;
}
