import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const indexPath = resolve(process.cwd(), "web-demo", "index.html");
const html = await readFile(indexPath, "utf8");
const nextHtml = html.replace(/<script src="([^"]+)" defer><\/script>/, '<script type="module" src="$1" defer></script>');

if (html !== nextHtml) {
  await writeFile(indexPath, nextHtml, "utf8");
}
