export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS collection_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  imageLocalPath TEXT,
  priceAtAcquisitionUSD REAL CHECK (priceAtAcquisitionUSD IS NULL OR priceAtAcquisitionUSD >= 0),
  currentPriceUSD REAL CHECK (currentPriceUSD IS NULL OR currentPriceUSD >= 0),
  currentPriceBRL REAL CHECK (currentPriceBRL IS NULL OR currentPriceBRL >= 0),
  exchangeRateUsed REAL,
  exchangeRateDate TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1) DEFAULT 1,
  isFavorite INTEGER NOT NULL DEFAULT 0 CHECK (isFavorite IN (0,1)),
  addedAt TEXT NOT NULL,
  lastPriceSyncAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_collection_favorite ON collection_items(isFavorite);
CREATE INDEX IF NOT EXISTS idx_collection_addedAt ON collection_items(addedAt DESC);
CREATE INDEX IF NOT EXISTS idx_collection_name ON collection_items(name);

CREATE TABLE IF NOT EXISTS exchange_rates (
  date TEXT PRIMARY KEY,
  rate REAL NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL,
  fetchedAt TEXT NOT NULL
);
`;

export type CollectionItemRow = {
  code: string;
  name: string;
  imageUrl: string;
  imageLocalPath: string | null;
  priceAtAcquisitionUSD: number | null;
  currentPriceUSD: number | null;
  currentPriceBRL: number | null;
  exchangeRateUsed: number | null;
  exchangeRateDate: string | null;
  quantity: number;
  isFavorite: number;
  addedAt: string;
  lastPriceSyncAt: string | null;
};
