import fs from "fs";
import matter from "gray-matter";
import jsYaml from "js-yaml";
import path from "path";
import { CONFIG } from "../config";
import { MappedMetadataCacheItem } from "../interfaces/cache";
import { customWriteDir } from "../utils/write";

const metadata: MappedMetadataCacheItem[] = JSON.parse(
  fs.readFileSync(CONFIG.PROCESSED_METADATA_FILEPATH, "utf8")
);

/* -------------------------------------------------------------------------- */
/*                                 copy files                                 */
/* -------------------------------------------------------------------------- */

for (const file of metadata) {
  const source = path.join(CONFIG.OBSIDIAN_DIR, file.relativeSourcePath);
  const destination = path.join(CONFIG.NOTES_DIST_DIR, file.relativePath);

  const sourceFile = fs.readFileSync(source);
  const newFileContent = matter.stringify(
    matter(sourceFile),
    file.frontmatter ?? {},
    {
      // need this segment for emojis in frontmatter
      engines: {
        yaml: {
          parse: jsYaml.load as (str: string) => object,
          stringify: jsYaml.dump,
        },
      },
    }
  );

  // mkdir if not exists
  const { dir } = path.parse(destination);
  customWriteDir(dir);
  fs.writeFileSync(destination, newFileContent);
}