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
import { processFrontmatter } from "./markdown";
import { MetaResolver } from "./metaResolver";
import {
  getNoteRoute,
  renameFilenameFromPath,
  slugify,
  stripWikilink,
} from "./string";
import { customWriteDir } from "../write";
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

const metadataPath = path.join(
  CONFIG.OBSIDIAN_DIR,
  CONFIG.METADATA_PLUGIN_DIR,
  "metadata.json"
);
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
  // if (Array.isArray(collection)) {
  // collection.forEach(c=> )
  // }
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
for (const collection of unWikilinkedCollectionCache) {
  const collectionNoteName = collection[0];
  const collectionNoteIndex = metadataCache.findIndex(
    (note) => note.fileName === collectionNoteName
  );

  if (collectionNoteIndex === -1)
    throw new Error(`invalid collection note: ${collectionNoteName}`);

  const collectionNoteCopy = metadataCache[collectionNoteIndex];

  if (collectionNoteCopy.frontmatter?.index) {
    collectionNoteCopy.relativePath = renameFilenameFromPath(
      collectionNoteCopy.relativePath,
      "index"
    );
  }

  // * if series, add frontmatter to collections-cache
  // create frontmatter if doesn't exist
  if (!collectionNoteCopy.frontmatter) {
    metadataCache[collectionNoteIndex].frontmatter = {};
  }
  if (collectionNoteCopy.frontmatter?.series) {
    metadataCache[collectionNoteIndex].frontmatter = {
      ...metadataCache[collectionNoteIndex].frontmatter,
      collectionItems: collectionNoteCopy.frontmatter.series,
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
  const collectionItems = collection[1].map(getNoteRoute);
  metadataCache[collectionNoteIndex].frontmatter!.collectionItems =
    collectionItems;
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
const destination = path.join(CONFIG.DIST_DIR, "processed-metadata.json");
fs.writeFileSync(destination, JSON.stringify(finalMetadata));
