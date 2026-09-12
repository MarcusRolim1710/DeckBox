import { create } from 'zustand';
import type { CollectionItem } from '../services/valuation';
import { computeTotals } from '../services/valuation';
import * as repo from '../services/collectionRepo';

type State = {
  items: CollectionItem[];
  favorites: CollectionItem[];
  totalsBRL: number;
  totalsUSD: number;
  loading: boolean;
  loadAll: () => Promise<void>;
  addByCode: (code: string) => Promise<void>;
  toggleFavorite: (code: string) => Promise<void>;
  updateQuantity: (code: string, q: number) => Promise<void>;
  remove: (code: string) => Promise<void>;
};

export const useCollectionStore = create<State>((set, get) => ({
  items: [],
  favorites: [],
  totalsBRL: 0,
  totalsUSD: 0,
  loading: false,
  loadAll: async () => {
    set({ loading: true });
    const items = await repo.listAll();
    const favs = items.filter((i) => i.isFavorite);
    const { totalValueBRL, totalValueUSD } = computeTotals(items);
    set({ items, favorites: favs, totalsBRL: totalValueBRL, totalsUSD: totalValueUSD, loading: false });
  },
  addByCode: async (code: string) => {
    await repo.addByCode(code);
    await get().loadAll();
  },
  toggleFavorite: async (code: string) => {
    await repo.toggleFavorite(code);
    await get().loadAll();
  },
  updateQuantity: async (code: string, q: number) => {
    await repo.updateQuantity(code, q);
    await get().loadAll();
  },
  remove: async (code: string) => {
    await repo.remove(code);
    await get().loadAll();
  },
}));
