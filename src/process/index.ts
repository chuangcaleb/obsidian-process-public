import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { CONFIG } from "../config";
import {
  CollectionCache,
  CollectionCacheEntries,
  MappedMetadataCacheItem,
} from "../interfaces/cache";
import { Metadata } from "../interfaces/obsidian-extractor";
import { runCommand } from "../utils/runCommand";
import { customWriteDir } from "../utils/write";
import { processFrontmatter } from "./markdown";
import { MetaResolver } from "./metaResolver";
import {
  getNoteRoute,
  getNoteRouteWithOverride,
  renameFilenameFromPath,
  slugify,
  stripWikilink,
} from "./string";
import { asArray } from "./utils";

/* -------------------------------------------------------------------------- */
/*                           Run Metadata Extractor                           */
/* -------------------------------------------------------------------------- */

const flag = process.argv.indexOf("-e") > -1;
if (flag) {
  runCommand(spawn("open", [CONFIG.METADATA_URI]));
}

/* -------------------------------------------------------------------------- */
/*                                    setup                                   */
/* -------------------------------------------------------------------------- */


const cacheBuffer = fs.readFileSync(CONFIG.SOURCE_METADATA_FILEPATH);
const originalMetadataCache: Metadata[] = JSON.parse(cacheBuffer.toString());

const metadataCache: MappedMetadataCacheItem[] = [];

/* -------------------------------------------------------------------------- */
/*                                   filter                                   */
/* -------------------------------------------------------------------------- */

for (const file of originalMetadataCache) {
  const relativeSourcePath = file.relativePath;
  const source = CONFIG.SOURCE_PATHS.find((source) =>
    source.filterPath(relativeSourcePath)
  );
  if (!source) continue;

  metadataCache.push({
    relativeSourcePath,
    ...file,
    relativePath: relativeSourcePath.slice(source.dir.length),
    // TODO: pop first H1 heading?
  });
}

// init resolver before modifying collection index names
const Resolver = new MetaResolver(metadataCache);

/* -------------------------------------------------------------------------- */
/*                             process collections                            */
/* -------------------------------------------------------------------------- */

const collectionCache: CollectionCache = {};

//  * build collection cache
for (const file of metadataCache) {
  const noteParents = file.frontmatter?.collection;

  // if note is not a collection, continue
  if (!noteParents) continue; // FIXME: sometimes collection is an array

  const slugRelativePath = getNoteRouteWithOverride(
    file.relativePath,
    !!file.frontmatter?.index
  );

  noteParents.forEach((noteParent: string) => {
    // create or add to array
    collectionCache[noteParent] = [
      ...asArray(collectionCache[noteParent]),
      slugRelativePath,
    ];
  });
}

// strip the [[]] off the keys
const unWikilinkedCollectionCache: CollectionCacheEntries = Object.entries(
  collectionCache
).map(([key, values]) => [stripWikilink(key), values]);

// populate collection note in cache with matching collection items
for (const collection of unWikilinkedCollectionCache) {
  // first index element is the name, second is the list of children
  const [collectionNoteName, collectionNotesNames] = collection;

  // find the corresponding collection note
  const collectionNote = metadataCache.find(
    (note) => note.fileName === collectionNoteName
  );

  // early exit, should never happen
  if (!collectionNote)
    throw new Error(`invalid collection note: ${collectionNoteName}`);

  // if is an index file, then rename filename as "index"
  if (collectionNote.frontmatter?.index) {
    collectionNote.relativePath = renameFilenameFromPath(
      collectionNote.relativePath,
      "index"
    );
  }

  // * if series, add frontmatter to collections-cache
  // create frontmatter if doesn't exist — unnecessary?
  // if (!collectionNote.frontmatter) {
  //   collectionNote.frontmatter = {};
  // }
  if (collectionNote.frontmatter?.series) {
    collectionNote.frontmatter = {
      ...(collectionNote.frontmatter ?? {}),
      collectionItems: collectionNote.frontmatter.series,
      series: true,
    };
    continue;
  }
  // ! NEXT FIXME: get all tags, too, not just collection metadata
  // if (collectionNoteCopy.frontmatter?.longform) {
  //   metadataCache[collectionNoteIndex].frontmatter = {
  //     ...metadataCache[collectionNoteIndex].frontmatter,
  //     collectionItems: collectionNoteCopy.frontmatter.longform.scenes,
  //     longform: undefined,
  //   };
  //   console.log(metadataCache[collectionNoteIndex].frontmatter);
  //   continue;
  // }
  const collectionItems = collectionNotesNames.map(getNoteRoute);
  collectionNote.frontmatter!.collectionItems = collectionItems;
}

// TODO: slugify everything?

/* -------------------------------------------------------------------------- */
/*                                    write                                   */
/* -------------------------------------------------------------------------- */

// write cache
// const metadataDistPath = path.join(metadataDistDir, "/metadata.json");
// fs.writeFileSync(metadataDistPath, JSON.stringify(metadataCache));

// write each file
const finalMetadata = metadataCache.map((file) => {
  // prepare final frontmatter
  // TODO: sanitize links
  // TODO: add links/backlinks into frontmatter?
  // TODO: add title frontmatter (if not exists) from context, or filename
  const finalFrontmatter = {
    ...processFrontmatter(file.frontmatter, Resolver),
    slug: slugify(getNoteRoute(file.relativePath)),
  };
  return { ...file, frontmatter: finalFrontmatter };
});

// clear dist dir
if (fs.existsSync(CONFIG.DIST_DIR))
  fs.rmSync(CONFIG.DIST_DIR, { recursive: true });
customWriteDir(CONFIG.DIST_DIR);

// write
fs.writeFileSync(CONFIG.PROCESSED_METADATA_FILEPATH, JSON.stringify(finalMetadata));
