// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IRCompiler = void 0;
var _rc4_statics = require("./rc4_statics");
const OPCODE_MAP = {
  OP_MOVE: 1,
  OP_LOADK: 2,
  OP_LOADNIL: 3,
  OP_LOADBOOL: 4,
  OP_GETUPVAL: 5,
  OP_SETUPVAL: 6,
  OP_GETGLOBAL: 7,
  OP_SETGLOBAL: 8,
  OP_GETTABLE: 9,
  OP_SETTABLE: 10,
  OP_NEWTABLE: 11,
  OP_SELF: 12,
  OP_ADD: 13,
  OP_SUB: 14,
  OP_MUL: 15,
  OP_DIV: 16,
  OP_IDIV: 17,
  OP_MOD: 18,
  OP_POW: 19,
  OP_UNM: 20,
  OP_NOT: 21,
  OP_LEN: 22,
  OP_CONCAT: 23,
  OP_JMP: 24,
  OP_EQ: 25,
  OP_LT: 26,
  OP_LE: 27,
  OP_TEST: 28,
  OP_CALL: 29,
  OP_RETURN: 30,
  OP_FORPREP: 31,
  OP_FORLOOP: 32,
  OP_TFORLOOP: 33,
  OP_SETLIST: 34,
  OP_CLOSURE: 35,
  OP_VARARG: 36,
  OP_CLOSE: 37,
  OP_LAZYDECODE: 38,
  OP_CHECKSUM512: 39,
  OP_RC4STREAM: 40
};
class IRCompiler {
  protoCounter = 0;
  opcodePermutation = [];
  constructor(seed = 0x5a7f1337) {
    this.opcodePermutation = this.buildOpcodePermutation(seed);
  }
  buildOpcodePermutation(seed) {
    const perm = [];
    for (let i = 0; i <= 40; i++) perm.push(i);
    let s = seed >>> 0;
    for (let i = 40; i >= 1; i--) {
      s = (829307 * s + 160273017) % 268435456;
      const j = s % i + 1;
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    return perm;
  }
  compileChunkToIR(chunk, constants) {
    const rootProto = {
      id: this.protoCounter++,
      name: "@azt_main_chunk",
      numParams: 0,
      isVararg: true,
      maxStackSize: 64,
      instructions: [],
      blocks: [],
      constants,
      upvalues: [],
      protos: []
    };
    const entryBlock = {
      id: 0,
      label: "BB_ENTRY",
      instructions: [],
      successors: [],
      predecessors: []
    };
    rootProto.blocks.push(entryBlock);
    this.emit(rootProto, entryBlock, "OP_CHECKSUM512", 0, 16, 0);
    this.emit(rootProto, entryBlock, "OP_RC4STREAM", 1, 256, 0);
    this.emit(rootProto, entryBlock, "OP_LAZYDECODE", 2, constants.length, 1);
    for (const stmt of chunk.body) {
      this.compileStatementIR(rootProto, entryBlock, stmt);
    }
    this.emit(rootProto, entryBlock, "OP_RETURN", 0, 1, 0);
    return rootProto;
  }
  emit(proto, block, op, A, B, C) {
    const rawId = OPCODE_MAP[op];
    const inst = {
      op,
      opcodeId: this.opcodePermutation[rawId] ?? rawId,
      A: A & 0xff,
      B: B & 0xffff,
      C: C & 0xff
    };
    block.instructions.push(inst);
    proto.instructions.push(inst);
  }
  compileStatementIR(proto, block, stmt) {
    switch (stmt.kind) {
      case "LocalStatement":
        for (let i = 0; i < stmt.variables.length; i++) {
          const initExpr = stmt.init[i];
          if (initExpr) {
            this.compileExprIR(proto, block, initExpr, i + 1);
          } else {
            this.emit(proto, block, "OP_LOADNIL", i + 1, 0, 0);
          }
        }
        break;
      case "AssignmentStatement":
        for (let i = 0; i < stmt.variables.length; i++) {
          const initExpr = stmt.init[i];
          if (initExpr) this.compileExprIR(proto, block, initExpr, i + 1);
          this.emit(proto, block, "OP_SETTABLE", 0, i + 1, i + 1);
        }
        break;
      case "CompoundAssignmentStatement":
        this.compileExprIR(proto, block, stmt.value, 1);
        this.emit(proto, block, "OP_ADD", 1, 1, 2);
        break;
      case "FunctionDeclaration":
        {
          const childProto = {
            id: this.protoCounter++,
            name: stmt.name.kind === "Identifier" ? stmt.name.name : "@azt_fn",
            numParams: stmt.parameters.length,
            isVararg: stmt.hasVararg,
            maxStackSize: 32,
            instructions: [],
            blocks: [],
            constants: [],
            upvalues: [],
            protos: []
          };
          const fnBlock = {
            id: 0,
            label: `BB_FN_${childProto.id}`,
            instructions: [],
            successors: [],
            predecessors: []
          };
          childProto.blocks.push(fnBlock);
          for (const s of stmt.body) {
            this.compileStatementIR(childProto, fnBlock, s);
          }
          this.emit(childProto, fnBlock, "OP_RETURN", 0, 1, 0);
          proto.protos.push(childProto);
          this.emit(proto, block, "OP_CLOSURE", 1, childProto.id, 0);
          break;
        }
      case "IfStatement":
        for (const clause of stmt.clauses) {
          this.compileExprIR(proto, block, clause.condition, 1);
          this.emit(proto, block, "OP_TEST", 1, 0, 0);
          this.emit(proto, block, "OP_JMP", 0, clause.body.length, 0);
          for (const s of clause.body) {
            this.compileStatementIR(proto, block, s);
          }
        }
        if (stmt.elseBody) {
          for (const s of stmt.elseBody) {
            this.compileStatementIR(proto, block, s);
          }
        }
        break;
      case "WhileStatement":
        this.compileExprIR(proto, block, stmt.condition, 1);
        this.emit(proto, block, "OP_TEST", 1, 0, 0);
        for (const s of stmt.body) {
          this.compileStatementIR(proto, block, s);
        }
        this.emit(proto, block, "OP_JMP", 0, 0, 0);
        break;
      case "RepeatStatement":
        for (const s of stmt.body) {
          this.compileStatementIR(proto, block, s);
        }
        this.compileExprIR(proto, block, stmt.condition, 1);
        this.emit(proto, block, "OP_TEST", 1, 0, 0);
        break;
      case "NumericForStatement":
        this.compileExprIR(proto, block, stmt.start, 1);
        this.compileExprIR(proto, block, stmt.end, 2);
        if (stmt.step) this.compileExprIR(proto, block, stmt.step, 3);
        this.emit(proto, block, "OP_FORPREP", 1, stmt.body.length, 0);
        for (const s of stmt.body) {
          this.compileStatementIR(proto, block, s);
        }
        this.emit(proto, block, "OP_FORLOOP", 1, 0, 0);
        break;
      case "GenericForStatement":
        for (let i = 0; i < stmt.iterators.length; i++) {
          this.compileExprIR(proto, block, stmt.iterators[i], i + 1);
        }
        for (const s of stmt.body) {
          this.compileStatementIR(proto, block, s);
        }
        this.emit(proto, block, "OP_TFORLOOP", 1, stmt.variables.length, 0);
        break;
      case "ReturnStatement":
        for (let i = 0; i < stmt.arguments.length; i++) {
          this.compileExprIR(proto, block, stmt.arguments[i], i + 1);
        }
        this.emit(proto, block, "OP_RETURN", 1, stmt.arguments.length + 1, 0);
        break;
      case "BreakStatement":
      case "ContinueStatement":
        this.emit(proto, block, "OP_JMP", 0, 1, 0);
        break;
      case "DoStatement":
        for (const s of stmt.body) {
          this.compileStatementIR(proto, block, s);
        }
        this.emit(proto, block, "OP_CLOSE", 0, 0, 0);
        break;
      case "CallStatement":
        this.compileExprIR(proto, block, stmt.expression, 1);
        break;
      case "TypeAliasStatement":
        break;
    }
  }
  compileExprIR(proto, block, expr, targetReg) {
    switch (expr.kind) {
      case "NilLiteral":
        this.emit(proto, block, "OP_LOADNIL", targetReg, 0, 0);
        break;
      case "BooleanLiteral":
        this.emit(proto, block, "OP_LOADBOOL", targetReg, expr.value ? 1 : 0, 0);
        break;
      case "NumericLiteral":
      case "StringLiteral":
      case "LazyConstantRef":
        this.emit(proto, block, "OP_LOADK", targetReg, 1, 0);
        break;
      case "Identifier":
        this.emit(proto, block, "OP_GETGLOBAL", targetReg, 1, 0);
        break;
      case "BinaryExpression":
        this.compileExprIR(proto, block, expr.left, targetReg);
        this.compileExprIR(proto, block, expr.right, targetReg + 1);
        this.emit(proto, block, "OP_ADD", targetReg, targetReg, targetReg + 1);
        break;
      case "UnaryExpression":
        this.compileExprIR(proto, block, expr.argument, targetReg);
        this.emit(proto, block, expr.operator === "not" ? "OP_NOT" : expr.operator === "#" ? "OP_LEN" : "OP_UNM", targetReg, targetReg, 0);
        break;
      case "CallExpression":
        this.compileExprIR(proto, block, expr.base, targetReg);
        for (let i = 0; i < expr.arguments.length; i++) {
          this.compileExprIR(proto, block, expr.arguments[i], targetReg + i + 1);
        }
        this.emit(proto, block, "OP_CALL", targetReg, expr.arguments.length + 1, 2);
        break;
      case "MethodCallExpression":
        this.compileExprIR(proto, block, expr.base, targetReg);
        this.emit(proto, block, "OP_SELF", targetReg, targetReg, 1);
        for (let i = 0; i < expr.arguments.length; i++) {
          this.compileExprIR(proto, block, expr.arguments[i], targetReg + i + 2);
        }
        this.emit(proto, block, "OP_CALL", targetReg, expr.arguments.length + 2, 2);
        break;
      case "TableConstructorExpression":
        this.emit(proto, block, "OP_NEWTABLE", targetReg, expr.fields.length, 0);
        for (let i = 0; i < expr.fields.length; i++) {
          this.compileExprIR(proto, block, expr.fields[i].value, targetReg + 1);
        }
        this.emit(proto, block, "OP_SETLIST", targetReg, expr.fields.length, 1);
        break;
      case "MemberExpression":
        this.compileExprIR(proto, block, expr.base, targetReg);
        this.emit(proto, block, "OP_GETTABLE", targetReg, targetReg, 1);
        break;
      case "IndexExpression":
        this.compileExprIR(proto, block, expr.base, targetReg);
        this.compileExprIR(proto, block, expr.index, targetReg + 1);
        this.emit(proto, block, "OP_GETTABLE", targetReg, targetReg, targetReg + 1);
        break;
      case "FunctionExpression":
        this.emit(proto, block, "OP_CLOSURE", targetReg, 0, 0);
        break;
      case "VarargLiteral":
        this.emit(proto, block, "OP_VARARG", targetReg, 0, 0);
        break;
      case "GroupExpression":
      case "TypeAssertionExpression":
        this.compileExprIR(proto, block, expr.expression, targetReg);
        break;
      case "IfExpression":
        this.compileExprIR(proto, block, expr.elseValue, targetReg);
        break;
    }
  }
  serializeIRHeader(proto) {
    const wm = Buffer.from(_rc4_statics.R4Statics.getStealthHeader(), "utf8");
    const instCount = Math.min(proto.instructions.length, 256);
    const buf = new Uint8Array(4 + instCount * 4 + wm.length);
    const view = new DataView(buf.buffer);
    view.setUint32(0, instCount, true);
    for (let i = 0; i < instCount; i++) {
      const inst = proto.instructions[i];
      const offset = 4 + i * 4;
      buf[offset] = inst.opcodeId & 0xff;
      buf[offset + 1] = inst.A & 0xff;
      buf[offset + 2] = inst.B & 0xff;
      buf[offset + 3] = inst.C & 0xff;
    }
    for (let i = 0; i < wm.length; i++) {
      buf[4 + instCount * 4 + i] = (wm[i] ^ i * 0x5d + 0x33 & 0xff) & 0xff;
    }
    return buf;
  }
}
exports.IRCompiler = IRCompiler;
