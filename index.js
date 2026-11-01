// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ASTRCRuntime", {
  enumerable: true,
  get: function () {
    return _ast_rcruntime.ASTRCRuntime;
  }
});
exports.AZTObfuscator = void 0;
Object.defineProperty(exports, "ConstantPoolBuilder", {
  enumerable: true,
  get: function () {
    return _rc4_statics.ConstantPoolBuilder;
  }
});
Object.defineProperty(exports, "IRCompiler", {
  enumerable: true,
  get: function () {
    return _ir.IRCompiler;
  }
});
Object.defineProperty(exports, "LuauLexer", {
  enumerable: true,
  get: function () {
    return _lexer.LuauLexer;
  }
});
Object.defineProperty(exports, "LuauParser", {
  enumerable: true,
  get: function () {
    return _parser.LuauParser;
  }
});
Object.defineProperty(exports, "R4Statics", {
  enumerable: true,
  get: function () {
    return _rc4_statics.R4Statics;
  }
});
Object.defineProperty(exports, "RC4Runtime", {
  enumerable: true,
  get: function () {
    return _rc4_runtime.RC4Runtime;
  }
});
Object.defineProperty(exports, "VMGenerator", {
  enumerable: true,
  get: function () {
    return _vm_generator.VMGenerator;
  }
});
var _ast_rcruntime = require("./ast_rcruntime");
var _ir = require("./ir");
var _lexer = require("./lexer");
var _parser = require("./parser");
var _rc4_runtime = require("./rc4_runtime");
var _rc4_statics = require("./rc4_statics");
var _vm_generator = require("./vm_generator");
class AZTObfuscator {
  static PACKAGE_NAME = "AZT_OBFUSCATOR";
  static WEBSITE_URL = "https://aztvn.top";
  static GITHUB_SHARE = "https://github.com/aztvn/AZT-Obfuscator-Soucre";
  static DISCORD_SHARE = "https://discord.gg/RneWWcMvG2";
  static obfuscate(source, config) {
    const startTime = process.hrtime.bigint();
    const seed = config?.seed ?? 0x415a5435;
    const lexer = new _lexer.LuauLexer(source);
    const tokens = lexer.tokenize();
    const parser = new _parser.LuauParser(tokens);
    const ast = parser.parseChunk();
    const checksum512 = _rc4_statics.R4Statics.generateChecksum512(`AZT_OBFUSCATOR:${seed}:${source.length}`, seed);
    const constantPool = new _rc4_statics.ConstantPoolBuilder(checksum512.words32);
    const astRuntime = new _ast_rcruntime.ASTRCRuntime(constantPool);
    const {
      encryptedASTBytes
    } = astRuntime.encryptRuntimeAST(ast, checksum512);
    const irCompiler = new _ir.IRCompiler(seed);
    const rootProto = irCompiler.compileChunkToIR(ast, constantPool.getEntries());
    const serializedIR = irCompiler.serializeIRHeader(rootProto);
    const {
      lphPayload
    } = _rc4_statics.R4Statics.encodeFullLPHPayload(constantPool, encryptedASTBytes, serializedIR, checksum512, seed ^ 0x9e3779b9);
    const code = _vm_generator.VMGenerator.generateVM(lphPayload, checksum512);
    const endTime = process.hrtime.bigint();
    const elapsedMs = Number(endTime - startTime) / 1e6;
    let irInstructionCount = rootProto.instructions.length;
    for (const p of rootProto.protos) {
      irInstructionCount += p.instructions.length;
    }
    return {
      code,
      elapsedMs,
      stats: {
        tokenCount: tokens.length,
        statementCount: ast.body.length,
        constantPoolSize: constantPool.getEntries().length,
        irInstructionCount,
        payloadLength: lphPayload.length,
        checksum512Words: checksum512.words32
      }
    };
  }
}
exports.AZTObfuscator = AZTObfuscator;
