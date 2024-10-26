import { Metadata } from "./obsidian-extractor";

export interface MappedMetadataCacheItem extends Metadata {
  relativeSourcePath: string;
}

export type CollectionCache = Record<string, string[]>;

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type CollectionCacheEntries = Entries<CollectionCache>;
