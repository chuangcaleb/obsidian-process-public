import { minimatch } from "minimatch";
import path from "path";

const PUBLIC_POSTS_DIR = "8 public/post/";
const publicPostsSource = {
  dir: PUBLIC_POSTS_DIR,
  filter: (path: string) => {
    const BAD_GLOBS = ["**/archive/**", "**/draft/**"];
    return (
      minimatch(path, `${PUBLIC_POSTS_DIR}/**`) &&
      !BAD_GLOBS.some((glob) => minimatch(path, glob))
    );
  },
};

export const CONFIG = {
  METADATA_URI: `obsidian://advanced-uri?vault=obsidian-caleb&commandid=metadata-extractor%253Awrite-metadata-json`,
  METADATA_PLUGIN_DIR: ".obsidian/plugins/metadata-extractor",
  OBSIDIAN_DIR: path.resolve(process.cwd() + "/../.."),
  DIST_DIR: path.resolve(process.cwd(), "./dist"),
  // DIST_DIR:
  //   "/Users/chuangcaleb/Documents/ComputerScience/web/chuangcaleb.com/src/content",
  // COLLECTIONS_DIR: "obsidian-collection",
  NOTES_DIR: "obsidian-note",
  SOURCE_PATHS: [publicPostsSource],
  COLLECTION_TAGS: ["📂/collection", "📂/collection/series"],
};
