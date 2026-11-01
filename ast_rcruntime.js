// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ASTRCRuntime = void 0;
var _rc4_statics = require("./rc4_statics");
const BIN_OP_MAP = {
  "+": 1,
  "-": 2,
  "*": 3,
  "/": 4,
  "//": 5,
  "%": 6,
  "^": 7,
  "..": 8,
  "==": 9,
  "~=": 10,
  "<": 11,
  "<=": 12,
  ">": 13,
  ">=": 14,
  "and": 15,
  "or": 16
};
const COMPOUND_OP_MAP = {
  "+=": 1,
  "-=": 2,
  "*=": 3,
  "/=": 4,
  "//=": 5,
  "%=": 6,
  "^=": 7,
  "..=": 8
};
const UNARY_OP_MAP = {
  "not": 1,
  "-": 2,
  "#": 3
};
class ASTRCRuntime {
  pool;
  bytes = [];
  constructor(pool) {
    this.pool = pool;
  }
  static deriveAstKeyFromChecksum512(checksum512) {
    const key = new Uint8Array(16);
    for (let m = 0; m < 16; m++) {
      key[m] = checksum512.words32[m] >>> m % 4 * 8 & 0xff;
    }
    return key;
  }
  serializeChunkBinary(chunk) {
    this.bytes = [];
    this.writeBlock(chunk.body, true);
    return new Uint8Array(this.bytes);
  }
  encryptRuntimeAST(chunk, checksum512) {
    const rawBytes = this.serializeChunkBinary(chunk);
    const astKey = ASTRCRuntime.deriveAstKeyFromChecksum512(checksum512);
    const encryptedASTBytes = _rc4_statics.R4Statics.rc4Crypt(rawBytes, astKey);
    return {
      normalizedCode: "",
      encryptedASTBytes
    };
  }
  writeU8(v) {
    this.bytes.push(v & 0xff);
  }
  writeU32(v) {
    const u = v >>> 0;
    this.bytes.push(u & 0xff, u >>> 8 & 0xff, u >>> 16 & 0xff, u >>> 24 & 0xff);
  }
  writeBlock(stmts, injectStealthOp = false) {
    const effective = stmts.filter(s => s.kind !== "TypeAliasStatement");
    const total = effective.length + (injectStealthOp ? 1 : 0);
    this.writeU32(total);
    if (injectStealthOp) {
      this.writeU8(15);
      this.writeU32(2);
    }
    for (const stmt of effective) {
      this.writeStatement(stmt);
    }
  }
  writeTarget(expr) {
    if (expr.kind === "Identifier") {
      this.writeU8(1);
      this.writeU32(this.pool.addString(expr.name));
    } else if (expr.kind === "MemberExpression") {
      this.writeU8(2);
      this.writeExpression(expr.base);
      this.writeU32(this.pool.addString(expr.identifier));
    } else if (expr.kind === "IndexExpression") {
      this.writeU8(3);
      this.writeExpression(expr.base);
      this.writeExpression(expr.index);
    } else {
      throw new Error(`Unsupported assignment target kind: ${expr.kind}`);
    }
  }
  writeStatement(stmt) {
    switch (stmt.kind) {
      case "TypeAliasStatement":
        this.writeU8(15);
        this.writeU32(2);
        return;
      case "LocalStatement":
        this.writeU8(1);
        this.writeU8(stmt.variables.length);
        for (const v of stmt.variables) {
          this.writeU32(this.pool.addString(v.name));
        }
        this.writeU8(stmt.init.length);
        for (const e of stmt.init) {
          this.writeExpression(e);
        }
        return;
      case "AssignmentStatement":
        this.writeU8(2);
        this.writeU8(stmt.variables.length);
        for (const v of stmt.variables) {
          this.writeTarget(v);
        }
        this.writeU8(stmt.init.length);
        for (const e of stmt.init) {
          this.writeExpression(e);
        }
        return;
      case "CompoundAssignmentStatement":
        this.writeU8(3);
        this.writeU8(COMPOUND_OP_MAP[stmt.operator] ?? 1);
        this.writeTarget(stmt.variable);
        this.writeExpression(stmt.value);
        return;
      case "FunctionDeclaration":
        this.writeU8(4);
        if (stmt.isLocal) {
          this.writeU8(1);
          this.writeU32(this.pool.addString(stmt.name.name));
        } else if (stmt.isMethod && stmt.name.kind === "MemberExpression") {
          this.writeU8(2);
          this.writeTarget(stmt.name);
        } else {
          this.writeU8(0);
          this.writeTarget(stmt.name);
        }
        this.writeU8(stmt.parameters.length);
        for (const p of stmt.parameters) {
          this.writeU32(this.pool.addString(p.name));
        }
        this.writeU8(stmt.hasVararg ? 1 : 0);
        this.writeBlock(stmt.body, true);
        return;
      case "IfStatement":
        this.writeU8(5);
        this.writeU8(stmt.clauses.length);
        for (const c of stmt.clauses) {
          this.writeExpression(c.condition);
          this.writeBlock(c.body, false);
        }
        if (stmt.elseBody) {
          this.writeU8(1);
          this.writeBlock(stmt.elseBody, false);
        } else {
          this.writeU8(0);
        }
        return;
      case "WhileStatement":
        this.writeU8(6);
        this.writeExpression(stmt.condition);
        this.writeBlock(stmt.body, false);
        return;
      case "RepeatStatement":
        this.writeU8(7);
        this.writeBlock(stmt.body, false);
        this.writeExpression(stmt.condition);
        return;
      case "NumericForStatement":
        this.writeU8(8);
        this.writeU32(this.pool.addString(stmt.variable.name));
        this.writeExpression(stmt.start);
        this.writeExpression(stmt.end);
        if (stmt.step) {
          this.writeU8(1);
          this.writeExpression(stmt.step);
        } else {
          this.writeU8(0);
        }
        this.writeBlock(stmt.body, false);
        return;
      case "GenericForStatement":
        this.writeU8(9);
        this.writeU8(stmt.variables.length);
        for (const v of stmt.variables) {
          this.writeU32(this.pool.addString(v.name));
        }
        this.writeU8(stmt.iterators.length);
        for (const it of stmt.iterators) {
          this.writeExpression(it);
        }
        this.writeBlock(stmt.body, false);
        return;
      case "ReturnStatement":
        this.writeU8(10);
        this.writeU8(stmt.arguments.length);
        for (const a of stmt.arguments) {
          this.writeExpression(a);
        }
        return;
      case "BreakStatement":
        this.writeU8(11);
        return;
      case "ContinueStatement":
        this.writeU8(12);
        return;
      case "DoStatement":
        this.writeU8(13);
        this.writeBlock(stmt.body, false);
        return;
      case "CallStatement":
        this.writeU8(14);
        this.writeExpression(stmt.expression);
        return;
    }
  }
  writeExpression(expr) {
    switch (expr.kind) {
      case "NilLiteral":
        this.writeU8(20);
        return;
      case "BooleanLiteral":
        this.writeU8(21);
        this.writeU8(expr.value ? 1 : 0);
        return;
      case "VarargLiteral":
        this.writeU8(22);
        return;
      case "NumericLiteral":
        this.writeU8(23);
        this.writeU32(this.pool.addNumber(expr.value));
        return;
      case "StringLiteral":
        this.writeU8(23);
        this.writeU32(this.pool.addString(expr.value));
        return;
      case "LazyConstantRef":
        this.writeU8(23);
        this.writeU32(expr.poolIndex);
        return;
      case "Identifier":
        this.writeU8(24);
        this.writeU32(this.pool.addString(expr.name));
        return;
      case "UnaryExpression":
        this.writeU8(25);
        this.writeU8(UNARY_OP_MAP[expr.operator] ?? 1);
        this.writeExpression(expr.argument);
        return;
      case "BinaryExpression":
        this.writeU8(26);
        this.writeU8(BIN_OP_MAP[expr.operator] ?? 1);
        this.writeExpression(expr.left);
        this.writeExpression(expr.right);
        return;
      case "IfExpression":
        this.writeU8(27);
        this.writeU8(expr.branches.length);
        for (const br of expr.branches) {
          this.writeExpression(br.condition);
          this.writeExpression(br.value);
        }
        this.writeExpression(expr.elseValue);
        return;
      case "FunctionExpression":
        this.writeU8(28);
        this.writeU8(expr.parameters.length);
        for (const p of expr.parameters) {
          this.writeU32(this.pool.addString(p.name));
        }
        this.writeU8(expr.hasVararg ? 1 : 0);
        this.writeBlock(expr.body, false);
        return;
      case "TableConstructorExpression":
        this.writeU8(29);
        this.writeU32(expr.fields.length);
        for (const f of expr.fields) {
          if (f.fieldKind === "List") {
            this.writeU8(1);
            this.writeExpression(f.value);
          } else if (f.fieldKind === "Name" && typeof f.key === "string") {
            this.writeU8(2);
            this.writeU32(this.pool.addString(f.key));
            this.writeExpression(f.value);
          } else if (f.fieldKind === "Index" && f.key && typeof f.key !== "string") {
            this.writeU8(3);
            this.writeExpression(f.key);
            this.writeExpression(f.value);
          }
        }
        return;
      case "MemberExpression":
        this.writeU8(30);
        this.writeExpression(expr.base);
        this.writeU32(this.pool.addString(expr.identifier));
        return;
      case "IndexExpression":
        this.writeU8(31);
        this.writeExpression(expr.base);
        this.writeExpression(expr.index);
        return;
      case "CallExpression":
        this.writeU8(32);
        this.writeExpression(expr.base);
        this.writeU8(expr.arguments.length);
        for (const a of expr.arguments) {
          this.writeExpression(a);
        }
        return;
      case "MethodCallExpression":
        this.writeU8(33);
        this.writeExpression(expr.base);
        this.writeU32(this.pool.addString(expr.method));
        this.writeU8(expr.arguments.length);
        for (const a of expr.arguments) {
          this.writeExpression(a);
        }
        return;
      case "GroupExpression":
        this.writeU8(34);
        this.writeExpression(expr.expression);
        return;
      case "TypeAssertionExpression":
        this.writeExpression(expr.expression);
        return;
    }
  }
}
exports.ASTRCRuntime = ASTRCRuntime;
