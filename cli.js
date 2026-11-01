// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _index = require("./index");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node dist/cli.js <input.lua> [output.lua]");
    process.exit(1);
  }
  const inputPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : inputPath.replace(/\.lua$/i, ".obf.lua");
  const source = fs.readFileSync(inputPath, "utf8");
  const result = _index.AZTObfuscator.obfuscate(source);
  fs.writeFileSync(outputPath, result.code, "utf8");
  console.log(`[AZT_OBFUSCATOR] Web: ${_index.AZTObfuscator.WEBSITE_URL} | GitHub: ${_index.AZTObfuscator.GITHUB_SHARE} | Discord: ${_index.AZTObfuscator.DISCORD_SHARE}`);
  console.log(`[AZT_OBFUSCATOR] Obfuscated ${path.basename(inputPath)} -> ${path.basename(outputPath)} in ${result.elapsedMs.toFixed(2)} ms`);
  console.log(`[AZT_OBFUSCATOR] Constants: ${result.stats.constantPoolSize} | IR Ops: ${result.stats.irInstructionCount} | Payload: ${result.stats.payloadLength} bytes`);
}
if (require.main === module) {
  main();
}
