// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

const fs = require("fs");
const path = require("path");

const HEADER = "// File This Create by AZT Service : https://discord.gg/RneWWcMvG2\n";

const TS_MODULES = [
  "types.ts",
  "lexer.ts",
  "parser.ts",
  "rc4_statics.ts",
  "ast_rcruntime.ts",
  "ir.ts",
  "rc4_runtime.ts",
  "vm_generator.ts",
  "index.ts",
  "cli.ts",
  "test_runner.ts"
];

function loadBabel() {
  const Module = require("module");
  const extraPaths = ["/usr/share/nodejs", "/usr/lib/nodejs"];
  for (const p of extraPaths) {
    if (!Module.globalPaths.includes(p)) {
      Module.globalPaths.push(p);
    }
  }
  return require("@babel/core");
}

function buildAll() {
  const babel = loadBabel();
  const srcDir = path.join(__dirname, "..", "src");
  const distDir = path.join(__dirname, "..", "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  for (const file of TS_MODULES) {
    const srcPath = path.join(srcDir, file);
    if (!fs.existsSync(srcPath)) continue;
    const outPath = path.join(distDir, file.replace(/\.ts$/, ".js"));
    const code = fs.readFileSync(srcPath, "utf8");
    const result = babel.transformSync(code, {
      filename: srcPath,
      presets: [
        ["/usr/share/nodejs/@babel/preset-typescript", { allowDeclareFields: true }]
      ],
      plugins: [
        "/usr/share/nodejs/@babel/plugin-transform-modules-commonjs"
      ],
      comments: false,
      compact: false,
      sourceMaps: false
    });

    let jsCode = HEADER + (result.code || "") + "\n";
    fs.writeFileSync(outPath, jsCode, "utf8");
    console.log(`[AZT_OBFUSCATOR] Built ${file} -> dist/${path.basename(outPath)}`);
  }
}

if (require.main === module) {
  buildAll();
}

module.exports = { buildAll };
