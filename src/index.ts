import { spawn } from "child_process";
import fs from "fs";
import matter from "gray-matter";
import YAML from "js-yaml";
import path from "path";
import { CONFIG } from "./config";
import {
  CollectionCache,
  CollectionCacheEntries,
  MappedMetadataCacheItem,
} from "./interfaces/cache";
import { Metadata } from "./interfaces/obsidian-extractor";
import { processFrontmatter } from "./markdown";
import { MetaResolver } from "./metaResolver";
import {
  getNoteRoute,
  renameFilenameFromPath,
  slugify,
  stripWikilink,
} from "./string";
import { customWriteDir } from "./write";
// import { parseYaml, stringifyYaml } from "obsidian";

const flag = process.argv.indexOf("-e") > -1;
if (flag) {
  const child = spawn("open", [CONFIG.METADATA_URI]);

  child.stdout.on("data", (data) => {
    console.log(`stdout:\n${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on("error", (error) => {
    console.error(`error: ${error.message}`);
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

/* -------------------------------------------------------------------------- */
/*                                    setup                                   */
/* -------------------------------------------------------------------------- */

const metadataPath = path.join(CONFIG.METADATA_PLUGIN_DIR, "metadata.json");
const cacheBuffer = fs.readFileSync(metadataPath);
const originalMetadataCache: Metadata[] = JSON.parse(cacheBuffer.toString());

const metadataCache: MappedMetadataCacheItem[] = [];

/* -------------------------------------------------------------------------- */
/*                                   filter                                   */
/* -------------------------------------------------------------------------- */

for (const file of originalMetadataCache) {
  const srcRelPath = file.relativePath;
  const source = CONFIG.SOURCE_PATHS.find((source) =>
    source.filter(srcRelPath)
  );
  if (!source) continue;

  metadataCache.push({
    relativeSourcePath: file.relativePath,
    ...file,
    relativePath: srcRelPath.slice(source.dir.length),
    // TODO: pop first H1 heading?
  });
}

// init resolver before modifying collection index names
const Resolver = new MetaResolver(metadataCache);

/* -------------------------------------------------------------------------- */
/*                             process collections                            */
/* -------------------------------------------------------------------------- */

const collectionCache: CollectionCache = {};
for (const file of metadataCache) {
  const collection = file.frontmatter?.collection;
  if (!collection) continue; // FIXME: sometimes collection is an array

  const slugRelativePath = getNoteRoute(file.relativePath);
  if (Array.isArray(collectionCache[collection])) {
    collectionCache[collection].push(slugRelativePath);
  } else {
    collectionCache[collection] = [slugRelativePath];
  }
}

// strip the [[]] off the keys
const unWikilinkedCollectionCache: CollectionCacheEntries = Object.entries(
  collectionCache
).map(([key, values]) => [stripWikilink(key), values]);

// popualate collection note in cache with matching collection items
for (const [index, collection] of unWikilinkedCollectionCache.entries()) {
  const collectionNoteName = collection[0];
  // const collectionItems = collection[1].map(getNoteRoute);
  const collectionNoteIndex = metadataCache.findIndex(
    (note) => note.fileName === collectionNoteName
  );

  // handle error
  if (!collectionNoteIndex)
    throw new Error(`invalid collection note ${collectionNoteName}?`);

  const collectionNoteCopy = metadataCache[collectionNoteIndex];
  // ! append collection items to frontmatter — REMOVED
  // if (!collectionNoteCopy.frontmatter) {
  //   metadataCache[collectionNoteIndex].frontmatter = {};
  // }
  // metadataCache[collectionNoteIndex].frontmatter!.collectionItems =
  //   collectionItems;

  // * if series, add frontmatter to collections-cache
  if (collectionNoteCopy.tags?.includes("📂/collection/series")) {
    // TODO: if series, then just check for synchronization
    // loop through frontmatter and pop from cache, throw error on diff
    unWikilinkedCollectionCache[index][1] =
      collectionNoteCopy.frontmatter?.series.map((s: string) =>
        Resolver.resolve(s)
      );
  }

  // else {
  //   const resolvedSeriesItems =
  //     collectionNoteCopy.frontmatter?.series.map(resolve);
  //   metadataCache[collectionNoteIndex].frontmatter!.series =
  //     resolvedSeriesItems;
  // }

  // if has a collection tag, rename rel path to index
  // if (!collectionNoteCopy?.tags) throw new Error("Collection should have tag");
  // if (collectionNoteCopy.tags.some((t) => CONFIG.COLLECTION_TAGS.includes(t)))
  metadataCache[collectionNoteIndex].relativePath = renameFilenameFromPath(
    collectionNoteCopy.relativePath,
    "index"
  );
}

// TODO: slugify everything?

/* -------------------------------------------------------------------------- */
/*                                    write                                   */
/* -------------------------------------------------------------------------- */

// clear dist dir
// if (fs.existsSync(CONFIG.DIST_DIR))
//   fs.rmSync(CONFIG.DIST_DIR, { recursive: true });

// create folders
const collectionsDistDir = path.join(CONFIG.DIST_DIR, CONFIG.COLLECTIONS_DIR);
const notesDistDir = path.join(CONFIG.DIST_DIR, CONFIG.NOTES_DIR);
customWriteDir(collectionsDistDir);
customWriteDir(notesDistDir);

// write cache
// const metadataDistPath = path.join(metadataDistDir, "/metadata.json");
// fs.writeFileSync(metadataDistPath, JSON.stringify(metadataCache));

// write collections
for (const collection of unWikilinkedCollectionCache) {
  const collectionsMetaDistPath = path.join(
    collectionsDistDir,
    collection[0] + ".json"
  );
  fs.writeFileSync(collectionsMetaDistPath, JSON.stringify(collection[1]));
}

// write each file
for (const file of metadataCache) {
  const source = path.join(CONFIG.OBSIDIAN_DIR, file.relativeSourcePath);
  const destination = path.join(notesDistDir, file.relativePath);

  // prepare final frontmatter
  // TODO: sanitize links
  // TODO: add links/backlinks into frontmatter?
  // TODO: add title frontmatter (if not exists) from context, or filename
  const finalFrontmatter = {
    ...processFrontmatter(file.frontmatter, Resolver),
    slug: slugify(getNoteRoute(file.relativePath)),
  };

  const sourceFile = fs.readFileSync(source);
  const newFileContent = matter.stringify(
    matter(sourceFile),
    finalFrontmatter,
    {
      // need this segment for emojis in frontmatter
      engines: {
        yaml: {
          parse: YAML.load as (str: string) => object,
          stringify: YAML.dump,
        },
      },
    }
  );

  // mkdir if not exists
  const { dir } = path.parse(destination);
  customWriteDir(dir);
  fs.writeFileSync(destination, newFileContent);
  // fs.copyFileSync(source, destination);
}
