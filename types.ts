// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

export type TokenType =
  | "EOF"
  | "Identifier"
  | "Keyword"
  | "Number"
  | "String"
  | "InterpString"
  | "Punctuation"
  | "Operator";

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
  line: number;
  column: number;
  start: number;
  end: number;
}

export type ASTNodeType =
  | "Chunk"
  | "Block"
  | "LocalStatement"
  | "AssignmentStatement"
  | "CompoundAssignmentStatement"
  | "FunctionDeclaration"
  | "IfStatement"
  | "WhileStatement"
  | "RepeatStatement"
  | "NumericForStatement"
  | "GenericForStatement"
  | "ReturnStatement"
  | "BreakStatement"
  | "ContinueStatement"
  | "DoStatement"
  | "CallStatement"
  | "TypeAliasStatement"
  | "BinaryExpression"
  | "UnaryExpression"
  | "IfExpression"
  | "FunctionExpression"
  | "TableConstructorExpression"
  | "TableField"
  | "MemberExpression"
  | "IndexExpression"
  | "CallExpression"
  | "MethodCallExpression"
  | "TypeAssertionExpression"
  | "GroupExpression"
  | "Identifier"
  | "StringLiteral"
  | "NumericLiteral"
  | "BooleanLiteral"
  | "NilLiteral"
  | "VarargLiteral"
  | "LazyConstantRef";

export interface ASTNode {
  kind: ASTNodeType;
  line?: number;
  column?: number;
}

export interface ChunkNode extends ASTNode {
  kind: "Chunk";
  body: StatementNode[];
}

export type StatementNode =
  | LocalStatementNode
  | AssignmentStatementNode
  | CompoundAssignmentStatementNode
  | FunctionDeclarationNode
  | IfStatementNode
  | WhileStatementNode
  | RepeatStatementNode
  | NumericForStatementNode
  | GenericForStatementNode
  | ReturnStatementNode
  | BreakStatementNode
  | ContinueStatementNode
  | DoStatementNode
  | CallStatementNode
  | TypeAliasStatementNode;

export interface LocalStatementNode extends ASTNode {
  kind: "LocalStatement";
  variables: IdentifierNode[];
  init: ExpressionNode[];
}

export interface AssignmentStatementNode extends ASTNode {
  kind: "AssignmentStatement";
  variables: ExpressionNode[];
  init: ExpressionNode[];
}

export interface CompoundAssignmentStatementNode extends ASTNode {
  kind: "CompoundAssignmentStatement";
  operator: "+=" | "-=" | "*=" | "/=" | "//=" | "%=" | "^=" | "..=";
  variable: ExpressionNode;
  value: ExpressionNode;
}

export interface FunctionDeclarationNode extends ASTNode {
  kind: "FunctionDeclaration";
  isLocal: boolean;
  name: ExpressionNode | IdentifierNode;
  isMethod: boolean;
  parameters: IdentifierNode[];
  hasVararg: boolean;
  body: StatementNode[];
}

export interface IfClause {
  condition: ExpressionNode;
  body: StatementNode[];
}

export interface IfStatementNode extends ASTNode {
  kind: "IfStatement";
  clauses: IfClause[];
  elseBody: StatementNode[] | null;
}

export interface WhileStatementNode extends ASTNode {
  kind: "WhileStatement";
  condition: ExpressionNode;
  body: StatementNode[];
}

export interface RepeatStatementNode extends ASTNode {
  kind: "RepeatStatement";
  body: StatementNode[];
  condition: ExpressionNode;
}

export interface NumericForStatementNode extends ASTNode {
  kind: "NumericForStatement";
  variable: IdentifierNode;
  start: ExpressionNode;
  end: ExpressionNode;
  step: ExpressionNode | null;
  body: StatementNode[];
}

export interface GenericForStatementNode extends ASTNode {
  kind: "GenericForStatement";
  variables: IdentifierNode[];
  iterators: ExpressionNode[];
  body: StatementNode[];
}

export interface ReturnStatementNode extends ASTNode {
  kind: "ReturnStatement";
  arguments: ExpressionNode[];
}

export interface BreakStatementNode extends ASTNode {
  kind: "BreakStatement";
}

export interface ContinueStatementNode extends ASTNode {
  kind: "ContinueStatement";
}

export interface DoStatementNode extends ASTNode {
  kind: "DoStatement";
  body: StatementNode[];
}

export interface CallStatementNode extends ASTNode {
  kind: "CallStatement";
  expression: ExpressionNode;
}

export interface TypeAliasStatementNode extends ASTNode {
  kind: "TypeAliasStatement";
  isExport: boolean;
  name: string;
}

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | IfExpressionNode
  | FunctionExpressionNode
  | TableConstructorExpressionNode
  | MemberExpressionNode
  | IndexExpressionNode
  | CallExpressionNode
  | MethodCallExpressionNode
  | TypeAssertionExpressionNode
  | GroupExpressionNode
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | NilLiteralNode
  | VarargLiteralNode
  | LazyConstantRefNode;

export interface BinaryExpressionNode extends ASTNode {
  kind: "BinaryExpression";
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpressionNode extends ASTNode {
  kind: "UnaryExpression";
  operator: "-" | "not" | "#";
  argument: ExpressionNode;
}

export interface IfExpressionBranch {
  condition: ExpressionNode;
  value: ExpressionNode;
}

export interface IfExpressionNode extends ASTNode {
  kind: "IfExpression";
  branches: IfExpressionBranch[];
  elseValue: ExpressionNode;
}

export interface FunctionExpressionNode extends ASTNode {
  kind: "FunctionExpression";
  parameters: IdentifierNode[];
  hasVararg: boolean;
  body: StatementNode[];
}

export interface TableFieldNode extends ASTNode {
  kind: "TableField";
  fieldKind: "Index" | "Name" | "List";
  key: ExpressionNode | string | null;
  value: ExpressionNode;
}

export interface TableConstructorExpressionNode extends ASTNode {
  kind: "TableConstructorExpression";
  fields: TableFieldNode[];
}

export interface MemberExpressionNode extends ASTNode {
  kind: "MemberExpression";
  base: ExpressionNode;
  identifier: string;
}

export interface IndexExpressionNode extends ASTNode {
  kind: "IndexExpression";
  base: ExpressionNode;
  index: ExpressionNode;
}

export interface CallExpressionNode extends ASTNode {
  kind: "CallExpression";
  base: ExpressionNode;
  arguments: ExpressionNode[];
}

export interface MethodCallExpressionNode extends ASTNode {
  kind: "MethodCallExpression";
  base: ExpressionNode;
  method: string;
  arguments: ExpressionNode[];
}

export interface TypeAssertionExpressionNode extends ASTNode {
  kind: "TypeAssertionExpression";
  expression: ExpressionNode;
}

export interface GroupExpressionNode extends ASTNode {
  kind: "GroupExpression";
  expression: ExpressionNode;
}

export interface IdentifierNode extends ASTNode {
  kind: "Identifier";
  name: string;
}

export interface StringLiteralNode extends ASTNode {
  kind: "StringLiteral";
  value: string;
  raw: string;
}

export interface NumericLiteralNode extends ASTNode {
  kind: "NumericLiteral";
  value: number;
  raw: string;
}

export interface BooleanLiteralNode extends ASTNode {
  kind: "BooleanLiteral";
  value: boolean;
}

export interface NilLiteralNode extends ASTNode {
  kind: "NilLiteral";
}

export interface VarargLiteralNode extends ASTNode {
  kind: "VarargLiteral";
}

export interface LazyConstantRefNode extends ASTNode {
  kind: "LazyConstantRef";
  poolIndex: number;
  originalKind: "string" | "number" | "boolean";
}

export type IROpcode =
  | "OP_MOVE"
  | "OP_LOADK"
  | "OP_LOADNIL"
  | "OP_LOADBOOL"
  | "OP_GETUPVAL"
  | "OP_SETUPVAL"
  | "OP_GETGLOBAL"
  | "OP_SETGLOBAL"
  | "OP_GETTABLE"
  | "OP_SETTABLE"
  | "OP_NEWTABLE"
  | "OP_SELF"
  | "OP_ADD"
  | "OP_SUB"
  | "OP_MUL"
  | "OP_DIV"
  | "OP_IDIV"
  | "OP_MOD"
  | "OP_POW"
  | "OP_UNM"
  | "OP_NOT"
  | "OP_LEN"
  | "OP_CONCAT"
  | "OP_JMP"
  | "OP_EQ"
  | "OP_LT"
  | "OP_LE"
  | "OP_TEST"
  | "OP_CALL"
  | "OP_RETURN"
  | "OP_FORPREP"
  | "OP_FORLOOP"
  | "OP_TFORLOOP"
  | "OP_SETLIST"
  | "OP_CLOSURE"
  | "OP_VARARG"
  | "OP_CLOSE"
  | "OP_LAZYDECODE"
  | "OP_CHECKSUM512"
  | "OP_RC4STREAM";

export interface IRInstruction {
  op: IROpcode;
  opcodeId: number;
  A: number;
  B: number;
  C: number;
  Bx?: number;
  sBx?: number;
  line?: number;
}

export interface IRBasicBlock {
  id: number;
  label: string;
  instructions: IRInstruction[];
  successors: number[];
  predecessors: number[];
}

export interface IRUpvalueDesc {
  name: string;
  inStack: boolean;
  index: number;
}

export interface IRProto {
  id: number;
  name: string;
  numParams: number;
  isVararg: boolean;
  maxStackSize: number;
  instructions: IRInstruction[];
  blocks: IRBasicBlock[];
  constants: ConstantPoolEntry[];
  upvalues: IRUpvalueDesc[];
  protos: IRProto[];
}

export interface ConstantPoolEntry {
  index: number;
  type: "string" | "number" | "boolean" | "nil";
  value: string | number | boolean | null;
  encryptedBytes: Uint8Array;
  lazyKey32: number;
  rotateShift: number;
  checksumWordIndex: number;
}

export interface Checksum512State {
  words32: number[];
  sha256Hex: string;
  sha512Hex: string;
  masterSeed: number;
}

export interface ObfuscationOptions {
  seed?: number;
  rc4Rounds?: number;
  lazyConstantDecode?: boolean;
  astRCRuntime?: boolean;
  checksum512?: boolean;
  controlFlowFlattening?: boolean;
  includeWatermarkComment?: boolean;
}

export interface ObfuscationResult {
  code: string;
  elapsedMs: number;
  stats: {
    tokensCount: number;
    astNodesCount: number;
    irInstructionsCount: number;
    constantsCount: number;
    payloadSizeBytes: number;
    outputSizeBytes: number;
    sha256Digest: string;
    checksum512Words: number[];
  };
}
