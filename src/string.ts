import path from "path";

// https://byby.dev/js-slugify-string
export function slugify(str: string) {
  return String(str)
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -/]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
}

export function renameFilenameFromPath(string: string, newFilename: string) {
  const { dir, ext } = path.parse(string);

  return path.join(dir, newFilename + ext);
}

export function getNoteRoute(filepath: string) {
  const { dir, name } = path.parse(filepath);
  if (name === "index") return dir;
  return path.join(dir, name);
}

export function stripWikilink(wikilink: string) {
  return wikilink.slice(2, wikilink.length - 2);
}
