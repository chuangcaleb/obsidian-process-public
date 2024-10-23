import { exec } from "child_process";
import fs from "fs";
import matter from "gray-matter";
import jsYaml from "js-yaml";
import path from "path";
import { CONFIG } from "../config";
import { MappedMetadataCacheItem } from "../interfaces/cache";
import { customWriteDir } from "../utils/write";
import { notesDistDir } from "./consts";

const metadataPath = path.join(CONFIG.DIST_DIR, "processed-metadata.json");
const metadata: MappedMetadataCacheItem[] = JSON.parse(
  fs.readFileSync(metadataPath, "utf8")
);

/* -------------------------------------------------------------------------- */
/*                                 copy files                                 */
/* -------------------------------------------------------------------------- */

for (const file of metadata) {
  const source = path.join(CONFIG.OBSIDIAN_DIR, file.relativeSourcePath);
  const destination = path.join(notesDistDir, file.relativePath);

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

/* -------------------------------------------------------------------------- */
/*                                     git                                    */
/* -------------------------------------------------------------------------- */

fs.copyFileSync(`.gitignore`, path.join(notesDistDir, ".gitignore"));

const currentDatetime = new Date().toLocaleString("en-gb");
const pushCommands = [
  `cd ${notesDistDir}`,
  // 'git checkout origin/main -f'
  "git add -A",
  `git commit -m "${currentDatetime}"`,
  "git push origin main",
];

try {
  exec(`(${pushCommands.join(";")})`);
} catch (error) {
  console.log(error);
}
