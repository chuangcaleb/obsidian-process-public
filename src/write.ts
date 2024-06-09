import fs from "fs";

// export async function customWriteFile(filepath: string, content: string) {
//   // mkdir if not exists
//   const { dir } = path.parse(filepath);
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

//   // write
//   fs.writeFileSync(filepath, content);
// }

export function customWriteDir(path: string) {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
}
