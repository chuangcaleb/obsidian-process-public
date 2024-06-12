import { extendedFrontMatterCache } from "../interfaces/obsidian-extractor";
import { MetaResolver } from "./metaResolver";

export function processFrontmatter(
  frontmatter: extendedFrontMatterCache | undefined,
  Resolver: MetaResolver
) {
  if (!frontmatter) return;
  const frontmatterObject = Object.entries(frontmatter);

  const processedFrontmatterObj = frontmatterObject.map(([key, value]) => [
    key,
    Resolver.resolve(value),
  ]);
  return Object.fromEntries(processedFrontmatterObj);
}
