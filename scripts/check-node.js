// scripts/check-node.js
// Cross-platform Node version guard — runs as npm predeploy hook.
// Reads required version from .nvmrc so there's a single source of truth.
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nvmrc = readFileSync(resolve(__dirname, "../.nvmrc"), "utf8").trim();
const required = parseInt(nvmrc, 10);
const actual = parseInt(process.versions.node.split(".")[0], 10);

if (actual < required) {
  console.error(`✗ Node ${required}+ required. You have ${process.version}.`);
  console.error(`  Mac/Linux: nvm use ${required}`);
  console.error(`  Windows:   nvm use ${required}   (nvm-windows) or download from nodejs.org`);
  process.exit(1);
}
