import path from "path";
import { MappedMetadataCacheItem } from "../interfaces/cache";
import { getNoteRoute } from "./string";

const nameFromWikilinkRegex = /\[\[([^|\]]+)/;
const dateRegex = /(\d{4}-\d{2}-\d{2}).*/;

export class MetaResolver {
  private _cache: { [key: string]: MappedMetadataCacheItem };

  constructor(cache: MappedMetadataCacheItem[]) {
    const cacheItems = Object.values(cache);
    this._cache = Object.fromEntries(
      cacheItems.map((item) => [path.parse(item.relativePath).name, item])
    );
  }

  resolveHelper(value: unknown) {
    if (typeof value !== "string") return value;

    // convert strings
    const match = value.match(nameFromWikilinkRegex);
    if (!match) return value;

    // convert date wikilinks
    const dateMatch = match[1].match(dateRegex);
    if (dateMatch) return new Date(dateMatch[1]).toISOString();

    // match to file
    const fileMatch = this._cache[match[1]];
    if (fileMatch) return getNoteRoute(fileMatch.relativePath);

    // else, just reaturn filename segment of wiklink
    return match[1];
  }

  resolve(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((i) => this.resolveHelper(i));
    }
    return this.resolveHelper(value);
  }
}
