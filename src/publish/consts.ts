import path from "path";
import { CONFIG } from "../config";


// create folder
export const notesDistDir = path.join(CONFIG.DIST_DIR, CONFIG.NOTES_DIR);
