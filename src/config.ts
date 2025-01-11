import { minimatch } from "minimatch";
import path from "path";

const PUBLIC_POSTS_DIR = "8 public/post/";
const publicPostsSource = {
  dir: PUBLIC_POSTS_DIR,
  filterPath: (path: string) => {
    const BAD_GLOBS = ["**/archive/**", "**/draft/**"];
    return (
      minimatch(path, `${PUBLIC_POSTS_DIR}/**`) &&
      !BAD_GLOBS.some((glob) => minimatch(path, glob))
    );
  },
};

const BASE_CONFIG = {
  // COLLECTIONS_DIR: "obsidian-collection",
  COLLECTION_TAGS: ["📂/collection", "📂/collection/series"],
  METADATA_PLUGIN_DIR: ".obsidian/plugins/metadata-extractor",
  METADATA_URI: `obsidian://advanced-uri?vault=obsidian-caleb&commandid=metadata-extractor%253Awrite-metadata-json`,
  SOURCE_PATHS: [publicPostsSource],
  /*  file system things -----------------------------------------*/
  OBSIDIAN_DIR: path.resolve(process.cwd() + "/../.."),
  PROCESSED_METADATA_FILENAME: "processed-metadata.json",
  DIST_DIR: path.resolve(process.cwd(), "./dist"),
  NOTES_SUBDIR: "obsidian-note",
} as const;

const CLOUD_SYNC_DIR = path.join(BASE_CONFIG.DIST_DIR, "cloud-sync-obsidian");
const DIST_NOTES_DIR = path.join(CLOUD_SYNC_DIR, BASE_CONFIG.NOTES_SUBDIR);
const SOURCE_METADATA_FILEPATH = path.join(
  BASE_CONFIG.OBSIDIAN_DIR,
  BASE_CONFIG.METADATA_PLUGIN_DIR,
  "metadata.json"
);
const DIST_EPHEMERAL_PATH = path.join(BASE_CONFIG.DIST_DIR, "ephemeral");
const PROCESSED_METADATA_FILEPATH = path.join(
  DIST_EPHEMERAL_PATH,
  BASE_CONFIG.PROCESSED_METADATA_FILENAME
);

export const CONFIG = {
  ...BASE_CONFIG,
  CLOUD_SYNC_DIR,
  DIST_NOTES_DIR,
  SOURCE_METADATA_FILEPATH,
  DIST_EPHEMERAL_PATH,
  PROCESSED_METADATA_FILEPATH,
} as const;
