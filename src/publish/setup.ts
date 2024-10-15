import { exec } from "child_process";
import fs from "fs";
import { CONFIG } from "../config";
import { customWriteDir } from "../utils/write";
import { notesDistDir } from "./consts";

/* -------------------------------------------------------------------------- */
/*                                    setup                                   */
/* -------------------------------------------------------------------------- */

// clear dist dir
if (fs.existsSync(notesDistDir)) fs.rmSync(notesDistDir, { recursive: true });
customWriteDir(notesDistDir);

const setupCommands = [
  `cd ${notesDistDir}`,
  "git init .",
  `git remote add origin ${CONFIG.PUBLIC_REPO}`,
  `git pull origin main`,
];

try {
  exec(`(${setupCommands.join(";")})`);
} catch (error) {
  console.log(error);
}
