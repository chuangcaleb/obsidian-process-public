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
  METADATA_URI: `obsidian://advanced-uri?vault=obsidian-caleb&commandid=metadata-extractor%253Awrite-metadata-json`,
  METADATA_PLUGIN_DIR: ".obsidian/plugins/metadata-extractor",
  OBSIDIAN_DIR: path.resolve(process.cwd() + "/../.."),
  DIST_DIR: path.resolve(process.cwd(), "./dist"),
  PROCESSED_METADATA_FILENAME: "processed-metadata.json",
  // COLLECTIONS_DIR: "obsidian-collection",
  NOTES_SUBDIR: "obsidian-note",
  SOURCE_PATHS: [publicPostsSource],
  COLLECTION_TAGS: ["📂/collection", "📂/collection/series"],
  PUBLIC_REPO: "https://github.com/chuangcaleb/obsidian-caleb-public.git",
};


const notesDistDir = path.join(BASE_CONFIG.DIST_DIR, BASE_CONFIG.NOTES_SUBDIR);
const processedMetadataFilepath = path.join(BASE_CONFIG.DIST_DIR, BASE_CONFIG.PROCESSED_METADATA_FILENAME);

export const CONFIG = {
  ...BASE_CONFIG,
  NOTES_DIST_DIR: notesDistDir,
  PROCESSED_METADATA_FILEPATH: processedMetadataFilepath,
}