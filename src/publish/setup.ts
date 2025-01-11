import fs from "fs";
import { customWriteDir } from "../utils/write";
import { notesDistDir } from "./consts";

/* -------------------------------------------------------------------------- */
/*                                    setup                                   */
/* -------------------------------------------------------------------------- */

// clear dist dir
if (fs.existsSync(notesDistDir)) fs.rmSync(notesDistDir, { recursive: true });
customWriteDir(notesDistDir);
