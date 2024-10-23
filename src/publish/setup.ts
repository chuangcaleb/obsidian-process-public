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

// early exit if --no-git
const flag = process.argv.indexOf("--no-git") > -1;
if (flag) process.exit();

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
