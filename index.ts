// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

import { ASTRCRuntime } from "./ast_rcruntime";
import { IRCompiler } from "./ir";
import { LuauLexer } from "./lexer";
import { LuauParser } from "./parser";
import { RC4Runtime } from "./rc4_runtime";
import { ConstantPoolBuilder, R4Statics } from "./rc4_statics";
import { Checksum512State, ChunkNode, IRProto, ObfuscatorConfig } from "./types";
import { VMGenerator } from "./vm_generator";

export interface ObfuscationResult {
  code: string;
  elapsedMs: number;
  stats: {
    tokenCount: number;
    statementCount: number;
    constantPoolSize: number;
    irInstructionCount: number;
    payloadLength: number;
    checksum512Words: number[];
  };
}

export class AZTObfuscator {
  public static readonly PACKAGE_NAME = "AZT_OBFUSCATOR";
  public static readonly WEBSITE_URL = "https://aztvn.top";
  public static readonly GITHUB_SHARE = "https://github.com/aztvn/AZT-Obfuscator-Soucre";
  public static readonly DISCORD_SHARE = "https://discord.gg/RneWWcMvG2";

  public static obfuscate(source: string, config?: Partial<ObfuscatorConfig>): ObfuscationResult {
    const startTime = process.hrtime.bigint();
    const seed = config?.seed ?? 0x415a5435;

    const lexer = new LuauLexer(source);
    const tokens = lexer.tokenize();

    const parser = new LuauParser(tokens);
    const ast: ChunkNode = parser.parseChunk();

    const checksum512: Checksum512State = R4Statics.generateChecksum512(
      `AZT_OBFUSCATOR:${seed}:${source.length}`,
      seed
    );

    const constantPool = new ConstantPoolBuilder(checksum512.words32);
    const astRuntime = new ASTRCRuntime(constantPool);
    const { encryptedASTBytes } = astRuntime.encryptRuntimeAST(ast, checksum512);

    const irCompiler = new IRCompiler(seed);
    const rootProto: IRProto = irCompiler.compileChunkToIR(ast, constantPool.getEntries());
    const serializedIR = irCompiler.serializeIRHeader(rootProto);

    const { lphPayload } = R4Statics.encodeFullLPHPayload(
      constantPool,
      encryptedASTBytes,
      serializedIR,
      checksum512,
      seed ^ 0x9e3779b9
    );

    const code = VMGenerator.generateVM(lphPayload, checksum512);
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

export {
  LuauLexer,
  LuauParser,
  ASTRCRuntime,
  IRCompiler,
  R4Statics,
  ConstantPoolBuilder,
  RC4Runtime,
  VMGenerator
};
