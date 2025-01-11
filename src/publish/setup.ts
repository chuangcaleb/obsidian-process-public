import fs from "fs";
import { customWriteDir } from "../utils/write";
import { CONFIG } from "../config";

/* -------------------------------------------------------------------------- */
/*                                    setup                                   */
/* -------------------------------------------------------------------------- */

const notesDistDir = CONFIG.NOTES_DIST_DIR;

// clear dist dir
if (fs.existsSync(notesDistDir)) fs.rmSync(notesDistDir, { recursive: true });
customWriteDir(notesDistDir);
