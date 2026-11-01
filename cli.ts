// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

import * as fs from "fs";
import * as path from "path";
import { AZTObfuscator } from "./index";

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node dist/cli.js <input.lua> [output.lua]");
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1]
    ? path.resolve(args[1])
    : inputPath.replace(/\.lua$/i, ".obf.lua");

  const source = fs.readFileSync(inputPath, "utf8");
  const result = AZTObfuscator.obfuscate(source);
  fs.writeFileSync(outputPath, result.code, "utf8");

  console.log(`[AZT_OBFUSCATOR] Web: ${AZTObfuscator.WEBSITE_URL} | GitHub: ${AZTObfuscator.GITHUB_SHARE} | Discord: ${AZTObfuscator.DISCORD_SHARE}`);
  console.log(`[AZT_OBFUSCATOR] Obfuscated ${path.basename(inputPath)} -> ${path.basename(outputPath)} in ${result.elapsedMs.toFixed(2)} ms`);
  console.log(`[AZT_OBFUSCATOR] Constants: ${result.stats.constantPoolSize} | IR Ops: ${result.stats.irInstructionCount} | Payload: ${result.stats.payloadLength} bytes`);
}

if (require.main === module) {
  main();
}
