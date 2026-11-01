// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

import {
  AssignmentStatementNode,
  BinaryExpressionNode,
  BooleanLiteralNode,
  BreakStatementNode,
  CallExpressionNode,
  CallStatementNode,
  ChunkNode,
  CompoundAssignmentStatementNode,
  ContinueStatementNode,
  DoStatementNode,
  ExpressionNode,
  FunctionDeclarationNode,
  FunctionExpressionNode,
  GenericForStatementNode,
  GroupExpressionNode,
  IdentifierNode,
  IfClause,
  IfExpressionBranch,
  IfExpressionNode,
  IfStatementNode,
  IndexExpressionNode,
  LocalStatementNode,
  MemberExpressionNode,
  MethodCallExpressionNode,
  NilLiteralNode,
  NumericForStatementNode,
  NumericLiteralNode,
  RepeatStatementNode,
  ReturnStatementNode,
  StatementNode,
  StringLiteralNode,
  TableConstructorExpressionNode,
  TableFieldNode,
  Token,
  TypeAliasStatementNode,
  UnaryExpressionNode,
  VarargLiteralNode,
  WhileStatementNode
} from "./types";

const COMPOUND_OPS = new Set(["+=", "-=", "*=", "/=", "//=", "%=", "^=", "..="]);

export class LuauParser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parseChunk(): ChunkNode {
    const body = this.parseBlock();
    this.expectType("EOF");
    return {
      kind: "Chunk",
      body,
      line: 1,
      column: 1
    };
  }

  private parseBlock(): StatementNode[] {
    const stmts: StatementNode[] = [];
    while (!this.isBlockFollow() && !this.isEOF()) {
      if (this.matchPunctuation(";")) {
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        stmts.push(stmt);
      }
      this.matchPunctuation(";");
      if (stmt && (stmt.kind === "ReturnStatement" || stmt.kind === "BreakStatement" || stmt.kind === "ContinueStatement")) {
        break;
      }
    }
    return stmts;
  }

  private isBlockFollow(): boolean {
    const tok = this.peek();
    if (tok.type === "EOF") return true;
    if (tok.type === "Keyword") {
      return tok.value === "else" || tok.value === "elseif" || tok.value === "end" || tok.value === "until";
    }
    return false;
  }

  private parseStatement(): StatementNode {
    const tok = this.peek();

    if (tok.type === "Keyword") {
      switch (tok.value) {
        case "local":
          return this.parseLocalStatement();
        case "function":
          return this.parseFunctionDeclaration(false);
        case "if":
          return this.parseIfStatement();
        case "while":
          return this.parseWhileStatement();
        case "repeat":
          return this.parseRepeatStatement();
        case "for":
          return this.parseForStatement();
        case "return":
          return this.parseReturnStatement();
        case "break":
          this.advance();
          return { kind: "BreakStatement", line: tok.line, column: tok.column };
        case "do":
          return this.parseDoStatement();
      }
    }

    if (tok.type === "Identifier" && tok.value === "continue") {
      const nextTok = this.peek(1);
      if (
        nextTok.value !== "=" &&
        nextTok.value !== "," &&
        nextTok.value !== "(" &&
        nextTok.value !== "." &&
        nextTok.value !== "[" &&
        nextTok.value !== ":" &&
        !COMPOUND_OPS.has(nextTok.value)
      ) {
        this.advance();
        return { kind: "ContinueStatement", line: tok.line, column: tok.column };
      }
    }

    if (tok.type === "Identifier" && tok.value === "export" && this.peek(1).type === "Identifier" && this.peek(1).value === "type") {
      return this.parseTypeAliasStatement(true);
    }
    if (tok.type === "Identifier" && tok.value === "type" && this.peek(1).type === "Identifier" && (this.peek(2).value === "=" || this.peek(2).value === "<")) {
      return this.parseTypeAliasStatement(false);
    }

    return this.parseExprOrAssignmentStatement();
  }

  private parseTypeAliasStatement(isExport: boolean): TypeAliasStatementNode {
    const startTok = this.peek();
    if (isExport) this.advance(); // consume 'export'
    this.advance(); // consume 'type'
    const nameTok = this.expectIdentifierOrKeyword();
    if (this.matchOperator("<")) {
      let depth = 1;
      while (!this.isEOF() && depth > 0) {
        if (this.matchOperator("<")) depth++;
        else if (this.matchOperator(">")) depth--;
        else this.advance();
      }
    }
    this.expectOperator("=");
    this.skipTypeAnnotation();
    return {
      kind: "TypeAliasStatement",
      isExport,
      name: nameTok.value,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseLocalStatement(): StatementNode {
    const startTok = this.expectKeyword("local");
    if (this.peek().type === "Keyword" && this.peek().value === "function") {
      return this.parseFunctionDeclaration(true);
    }

    const variables: IdentifierNode[] = [];
    do {
      const idTok = this.expectIdentifier();
      if (this.matchPunctuation(":")) {
        this.skipTypeAnnotation();
      }
      variables.push({
        kind: "Identifier",
        name: idTok.value,
        line: idTok.line,
        column: idTok.column
      });
    } while (this.matchPunctuation(","));

    let init: ExpressionNode[] = [];
    if (this.matchOperator("=")) {
      init = this.parseExpressionList();
    }

    return {
      kind: "LocalStatement",
      variables,
      init,
      line: startTok.line,
      column: startTok.column
    } as LocalStatementNode;
  }

  private parseFunctionDeclaration(isLocal: boolean): FunctionDeclarationNode {
    const startTok = this.expectKeyword("function");
    let nameExpr: ExpressionNode | IdentifierNode;
    const firstId = this.expectIdentifier();
    nameExpr = {
      kind: "Identifier",
      name: firstId.value,
      line: firstId.line,
      column: firstId.column
    };

    let isMethod = false;
    if (!isLocal) {
      while (this.matchPunctuation(".")) {
        const prop = this.expectIdentifierOrKeyword();
        nameExpr = {
          kind: "MemberExpression",
          base: nameExpr,
          identifier: prop.value,
          line: prop.line,
          column: prop.column
        };
      }
      if (this.matchPunctuation(":")) {
        const methodProp = this.expectIdentifierOrKeyword();
        isMethod = true;
        nameExpr = {
          kind: "MemberExpression",
          base: nameExpr,
          identifier: methodProp.value,
          line: methodProp.line,
          column: methodProp.column
        };
      }
    }

    const { parameters, hasVararg, body } = this.parseFunctionBody();
    return {
      kind: "FunctionDeclaration",
      isLocal,
      name: nameExpr,
      isMethod,
      parameters,
      hasVararg,
      body,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseFunctionBody(): { parameters: IdentifierNode[]; hasVararg: boolean; body: StatementNode[] } {
    if (this.matchOperator("<")) {
      let depth = 1;
      while (!this.isEOF() && depth > 0) {
        if (this.matchOperator("<")) depth++;
        else if (this.matchOperator(">")) depth--;
        else this.advance();
      }
    }

    this.expectPunctuation("(");
    const parameters: IdentifierNode[] = [];
    let hasVararg = false;

    if (!this.checkPunctuation(")")) {
      do {
        if (this.matchPunctuation("...")) {
          hasVararg = true;
          if (this.matchPunctuation(":")) {
            this.skipTypeAnnotation();
          }
          break;
        }
        const paramTok = this.expectIdentifier();
        if (this.matchPunctuation(":")) {
          this.skipTypeAnnotation();
        }
        parameters.push({
          kind: "Identifier",
          name: paramTok.value,
          line: paramTok.line,
          column: paramTok.column
        });
      } while (this.matchPunctuation(","));
    }
    this.expectPunctuation(")");

    if (this.matchPunctuation(":")) {
      this.skipTypeAnnotation();
    }

    const body = this.parseBlock();
    this.expectKeyword("end");
    return { parameters, hasVararg, body };
  }

  private skipTypeAnnotation(): void {
    let parenDepth = 0;
    let braceDepth = 0;
    let angleDepth = 0;
    let bracketDepth = 0;

    while (!this.isEOF()) {
      const tok = this.peek();

      if (parenDepth === 0 && braceDepth === 0 && angleDepth === 0 && bracketDepth === 0) {
        if (tok.value === "," || tok.value === ")" || tok.value === "=" || tok.value === ";") {
          break;
        }
        if (tok.type === "Keyword" && tok.value !== "nil" && tok.value !== "true" && tok.value !== "false" && tok.value !== "function") {
          break;
        }
      }

      if (tok.value === "(") parenDepth++;
      else if (tok.value === ")") {
        if (parenDepth > 0) parenDepth--;
        else break;
      } else if (tok.value === "{") braceDepth++;
      else if (tok.value === "}") {
        if (braceDepth > 0) braceDepth--;
        else break;
      } else if (tok.value === "<") angleDepth++;
      else if (tok.value === ">") {
        if (angleDepth > 0) angleDepth--;
      } else if (tok.value === "[") bracketDepth++;
      else if (tok.value === "]") {
        if (bracketDepth > 0) bracketDepth--;
        else break;
      }

      this.advance();

      if (parenDepth === 0 && braceDepth === 0 && angleDepth === 0 && bracketDepth === 0) {
        const nextTok = this.peek();
        if (nextTok.value === "|" || nextTok.value === "&" || nextTok.value === "?" || nextTok.value === "->" || nextTok.value === ".") {
          this.advance();
          continue;
        }
        break;
      }
    }
  }

  private parseIfStatement(): IfStatementNode {
    const startTok = this.expectKeyword("if");
    const clauses: IfClause[] = [];

    const firstCond = this.parseExpression();
    this.expectKeyword("then");
    const firstBody = this.parseBlock();
    clauses.push({ condition: firstCond, body: firstBody });

    while (this.matchKeyword("elseif")) {
      const cond = this.parseExpression();
      this.expectKeyword("then");
      const body = this.parseBlock();
      clauses.push({ condition: cond, body });
    }

    let elseBody: StatementNode[] | null = null;
    if (this.matchKeyword("else")) {
      elseBody = this.parseBlock();
    }

    this.expectKeyword("end");
    return {
      kind: "IfStatement",
      clauses,
      elseBody,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseWhileStatement(): WhileStatementNode {
    const startTok = this.expectKeyword("while");
    const condition = this.parseExpression();
    this.expectKeyword("do");
    const body = this.parseBlock();
    this.expectKeyword("end");
    return {
      kind: "WhileStatement",
      condition,
      body,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseRepeatStatement(): RepeatStatementNode {
    const startTok = this.expectKeyword("repeat");
    const body = this.parseBlock();
    this.expectKeyword("until");
    const condition = this.parseExpression();
    return {
      kind: "RepeatStatement",
      body,
      condition,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseForStatement(): StatementNode {
    const startTok = this.expectKeyword("for");
    const firstVar = this.expectIdentifier();
    if (this.matchPunctuation(":")) {
      this.skipTypeAnnotation();
    }

    if (this.matchOperator("=")) {
      const start = this.parseExpression();
      this.expectPunctuation(",");
      const end = this.parseExpression();
      let step: ExpressionNode | null = null;
      if (this.matchPunctuation(",")) {
        step = this.parseExpression();
      }
      this.expectKeyword("do");
      const body = this.parseBlock();
      this.expectKeyword("end");
      return {
        kind: "NumericForStatement",
        variable: { kind: "Identifier", name: firstVar.value, line: firstVar.line, column: firstVar.column },
        start,
        end,
        step,
        body,
        line: startTok.line,
        column: startTok.column
      } as NumericForStatementNode;
    }

    const variables: IdentifierNode[] = [
      { kind: "Identifier", name: firstVar.value, line: firstVar.line, column: firstVar.column }
    ];
    while (this.matchPunctuation(",")) {
      const vTok = this.expectIdentifier();
      if (this.matchPunctuation(":")) {
        this.skipTypeAnnotation();
      }
      variables.push({ kind: "Identifier", name: vTok.value, line: vTok.line, column: vTok.column });
    }

    this.expectKeyword("in");
    const iterators = this.parseExpressionList();
    this.expectKeyword("do");
    const body = this.parseBlock();
    this.expectKeyword("end");

    return {
      kind: "GenericForStatement",
      variables,
      iterators,
      body,
      line: startTok.line,
      column: startTok.column
    } as GenericForStatementNode;
  }

  private parseReturnStatement(): ReturnStatementNode {
    const startTok = this.expectKeyword("return");
    let args: ExpressionNode[] = [];
    if (!this.isBlockFollow() && !this.checkPunctuation(";")) {
      args = this.parseExpressionList();
    }
    return {
      kind: "ReturnStatement",
      arguments: args,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseDoStatement(): DoStatementNode {
    const startTok = this.expectKeyword("do");
    const body = this.parseBlock();
    this.expectKeyword("end");
    return {
      kind: "DoStatement",
      body,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parseExprOrAssignmentStatement(): StatementNode {
    const startTok = this.peek();
    const firstExpr = this.parsePrefixExpression();

    const nextTok = this.peek();
    if (nextTok.type === "Operator" && COMPOUND_OPS.has(nextTok.value)) {
      const op = this.advance().value as CompoundAssignmentStatementNode["operator"];
      const rhs = this.parseExpression();
      return {
        kind: "CompoundAssignmentStatement",
        operator: op,
        variable: firstExpr,
        value: rhs,
        line: startTok.line,
        column: startTok.column
      };
    }

    if (this.checkPunctuation(",") || this.checkOperator("=")) {
      const variables: ExpressionNode[] = [firstExpr];
      while (this.matchPunctuation(",")) {
        variables.push(this.parsePrefixExpression());
      }
      this.expectOperator("=");
      const init = this.parseExpressionList();
      return {
        kind: "AssignmentStatement",
        variables,
        init,
        line: startTok.line,
        column: startTok.column
      } as AssignmentStatementNode;
    }

    if (firstExpr.kind !== "CallExpression" && firstExpr.kind !== "MethodCallExpression") {
      throw new SyntaxError(
        `Unexpected expression statement '${firstExpr.kind}' at line ${startTok.line}:${startTok.column} (near '${this.peek().value}')`
      );
    }

    return {
      kind: "CallStatement",
      expression: firstExpr,
      line: startTok.line,
      column: startTok.column
    } as CallStatementNode;
  }

  private parseExpressionList(): ExpressionNode[] {
    const exprs: ExpressionNode[] = [this.parseExpression()];
    while (this.matchPunctuation(",")) {
      exprs.push(this.parseExpression());
    }
    return exprs;
  }

  public parseExpression(minPrec: number = 1): ExpressionNode {
    let left = this.parseUnaryOrPrimaryExpression();

    while (this.matchOperator("::")) {
      this.skipTypeAnnotation();
      left = {
        kind: "TypeAssertionExpression",
        expression: left,
        line: left.line,
        column: left.column
      };
    }

    while (true) {
      const tok = this.peek();
      const prec = this.getBinaryPrecedence(tok);
      if (prec < minPrec) break;

      const op = this.advance().value;
      const nextMinPrec = op === "^" || op === ".." ? prec : prec + 1;
      const right = this.parseExpression(nextMinPrec);
      left = {
        kind: "BinaryExpression",
        operator: op,
        left,
        right,
        line: tok.line,
        column: tok.column
      } as BinaryExpressionNode;
    }

    return left;
  }

  private getBinaryPrecedence(tok: Token): number {
    if (tok.type === "Keyword") {
      if (tok.value === "or") return 1;
      if (tok.value === "and") return 2;
      return 0;
    }
    if (tok.type !== "Operator") return 0;
    switch (tok.value) {
      case "<":
      case ">":
      case "<=":
      case ">=":
      case "~=":
      case "==":
        return 3;
      case "..":
        return 4;
      case "+":
      case "-":
        return 5;
      case "*":
      case "/":
      case "//":
      case "%":
        return 6;
      case "^":
        return 8;
      default:
        return 0;
    }
  }

  private parseUnaryOrPrimaryExpression(): ExpressionNode {
    const tok = this.peek();
    if (
      (tok.type === "Keyword" && tok.value === "not") ||
      (tok.type === "Operator" && (tok.value === "-" || tok.value === "#"))
    ) {
      this.advance();
      const arg = this.parseExpression(7);
      return {
        kind: "UnaryExpression",
        operator: tok.value as "-" | "not" | "#",
        argument: arg,
        line: tok.line,
        column: tok.column
      } as UnaryExpressionNode;
    }

    return this.parsePrimaryOrPostfixExpression();
  }

  private parsePrimaryOrPostfixExpression(): ExpressionNode {
    const tok = this.peek();

    if (tok.type === "Keyword") {
      switch (tok.value) {
        case "nil":
          this.advance();
          return { kind: "NilLiteral", line: tok.line, column: tok.column } as NilLiteralNode;
        case "true":
          this.advance();
          return { kind: "BooleanLiteral", value: true, line: tok.line, column: tok.column } as BooleanLiteralNode;
        case "false":
          this.advance();
          return { kind: "BooleanLiteral", value: false, line: tok.line, column: tok.column } as BooleanLiteralNode;
        case "function": {
          this.advance();
          const { parameters, hasVararg, body } = this.parseFunctionBody();
          return {
            kind: "FunctionExpression",
            parameters,
            hasVararg,
            body,
            line: tok.line,
            column: tok.column
          } as FunctionExpressionNode;
        }
        case "if":
          return this.parseIfExpression();
      }
    }

    if (tok.type === "Number") {
      this.advance();
      return {
        kind: "NumericLiteral",
        value: Number(tok.value),
        raw: tok.raw,
        line: tok.line,
        column: tok.column
      } as NumericLiteralNode;
    }

    if (tok.type === "String") {
      this.advance();
      return {
        kind: "StringLiteral",
        value: tok.value,
        raw: tok.raw,
        line: tok.line,
        column: tok.column
      } as StringLiteralNode;
    }

    if (tok.type === "Punctuation" && tok.value === "...") {
      this.advance();
      return { kind: "VarargLiteral", line: tok.line, column: tok.column } as VarargLiteralNode;
    }

    if (tok.type === "Punctuation" && tok.value === "{") {
      return this.parseTableConstructor();
    }

    return this.parsePrefixExpression();
  }

  private parseIfExpression(): IfExpressionNode {
    const startTok = this.expectKeyword("if");
    const branches: IfExpressionBranch[] = [];

    const firstCond = this.parseExpression();
    this.expectKeyword("then");
    const firstVal = this.parseExpression();
    branches.push({ condition: firstCond, value: firstVal });

    while (this.matchKeyword("elseif")) {
      const cond = this.parseExpression();
      this.expectKeyword("then");
      const val = this.parseExpression();
      branches.push({ condition: cond, value: val });
    }

    this.expectKeyword("else");
    const elseValue = this.parseExpression();

    return {
      kind: "IfExpression",
      branches,
      elseValue,
      line: startTok.line,
      column: startTok.column
    };
  }

  private parsePrefixExpression(): ExpressionNode {
    const tok = this.peek();
    let base: ExpressionNode;

    if (this.matchPunctuation("(")) {
      const inner = this.parseExpression();
      this.expectPunctuation(")");
      base = {
        kind: "GroupExpression",
        expression: inner,
        line: tok.line,
        column: tok.column
      } as GroupExpressionNode;
    } else if (tok.type === "Identifier") {
      this.advance();
      base = {
        kind: "Identifier",
        name: tok.value,
        line: tok.line,
        column: tok.column
      } as IdentifierNode;
    } else {
      throw new SyntaxError(`Unexpected token '${tok.value}' (${tok.type}) at line ${tok.line}:${tok.column}`);
    }

    while (true) {
      const next = this.peek();
      if (this.matchPunctuation(".")) {
        const prop = this.expectIdentifierOrKeyword();
        base = {
          kind: "MemberExpression",
          base,
          identifier: prop.value,
          line: prop.line,
          column: prop.column
        } as MemberExpressionNode;
      } else if (this.matchPunctuation("[")) {
        const idxExpr = this.parseExpression();
        this.expectPunctuation("]");
        base = {
          kind: "IndexExpression",
          base,
          index: idxExpr,
          line: next.line,
          column: next.column
        } as IndexExpressionNode;
      } else if (this.matchPunctuation(":")) {
        const methodTok = this.expectIdentifierOrKeyword();
        const args = this.parseCallArguments();
        base = {
          kind: "MethodCallExpression",
          base,
          method: methodTok.value,
          arguments: args,
          line: methodTok.line,
          column: methodTok.column
        } as MethodCallExpressionNode;
      } else if (
        (next.type === "Punctuation" && (next.value === "(" || next.value === "{")) ||
        next.type === "String"
      ) {
        const args = this.parseCallArguments();
        base = {
          kind: "CallExpression",
          base,
          arguments: args,
          line: next.line,
          column: next.column
        } as CallExpressionNode;
      } else {
        break;
      }
    }

    return base;
  }

  private parseCallArguments(): ExpressionNode[] {
    const tok = this.peek();
    if (this.matchPunctuation("(")) {
      const args: ExpressionNode[] = [];
      if (!this.checkPunctuation(")")) {
        do {
          args.push(this.parseExpression());
        } while (this.matchPunctuation(","));
      }
      this.expectPunctuation(")");
      return args;
    }
    if (tok.type === "Punctuation" && tok.value === "{") {
      return [this.parseTableConstructor()];
    }
    if (tok.type === "String") {
      this.advance();
      return [
        {
          kind: "StringLiteral",
          value: tok.value,
          raw: tok.raw,
          line: tok.line,
          column: tok.column
        } as StringLiteralNode
      ];
    }
    throw new SyntaxError(`Expected function call arguments at line ${tok.line}:${tok.column}`);
  }

  private parseTableConstructor(): TableConstructorExpressionNode {
    const startTok = this.expectPunctuation("{");
    const fields: TableFieldNode[] = [];

    while (!this.checkPunctuation("}") && !this.isEOF()) {
      const fTok = this.peek();
      if (this.matchPunctuation("[")) {
        const keyExpr = this.parseExpression();
        this.expectPunctuation("]");
        this.expectOperator("=");
        const valExpr = this.parseExpression();
        fields.push({
          kind: "TableField",
          fieldKind: "Index",
          key: keyExpr,
          value: valExpr,
          line: fTok.line,
          column: fTok.column
        });
      } else if (
        (fTok.type === "Identifier" || fTok.type === "Keyword") &&
        this.peek(1).type === "Operator" &&
        this.peek(1).value === "="
      ) {
        const nameTok = this.advance();
        this.expectOperator("=");
        const valExpr = this.parseExpression();
        fields.push({
          kind: "TableField",
          fieldKind: "Name",
          key: nameTok.value,
          value: valExpr,
          line: fTok.line,
          column: fTok.column
        });
      } else {
        const valExpr = this.parseExpression();
        fields.push({
          kind: "TableField",
          fieldKind: "List",
          key: null,
          value: valExpr,
          line: fTok.line,
          column: fTok.column
        });
      }

      if (!this.matchPunctuation(",") && !this.matchPunctuation(";")) {
        break;
      }
    }

    this.expectPunctuation("}");
    return {
      kind: "TableConstructorExpression",
      fields,
      line: startTok.line,
      column: startTok.column
    };
  }

  private peek(offset: number = 0): Token {
    const idx = Math.min(this.pos + offset, this.tokens.length - 1);
    return this.tokens[idx];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) {
      this.pos++;
    }
    return tok;
  }

  private isEOF(): boolean {
    return this.peek().type === "EOF";
  }

  private checkPunctuation(val: string): boolean {
    const tok = this.peek();
    return tok.type === "Punctuation" && tok.value === val;
  }

  private matchPunctuation(val: string): boolean {
    if (this.checkPunctuation(val)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expectPunctuation(val: string): Token {
    const tok = this.peek();
    if (tok.type === "Punctuation" && tok.value === val) {
      return this.advance();
    }
    throw new SyntaxError(`Expected '${val}' but got '${tok.value}' at line ${tok.line}:${tok.column}`);
  }

  private checkOperator(val: string): boolean {
    const tok = this.peek();
    return tok.type === "Operator" && tok.value === val;
  }

  private matchOperator(val: string): boolean {
    if (this.checkOperator(val)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expectOperator(val: string): Token {
    const tok = this.peek();
    if (tok.type === "Operator" && tok.value === val) {
      return this.advance();
    }
    throw new SyntaxError(`Expected operator '${val}' but got '${tok.value}' at line ${tok.line}:${tok.column}`);
  }

  private matchKeyword(val: string): boolean {
    const tok = this.peek();
    if (tok.type === "Keyword" && tok.value === val) {
      this.advance();
      return true;
    }
    return false;
  }

  private expectKeyword(val: string): Token {
    const tok = this.peek();
    if (tok.type === "Keyword" && tok.value === val) {
      return this.advance();
    }
    throw new SyntaxError(`Expected keyword '${val}' but got '${tok.value}' at line ${tok.line}:${tok.column}`);
  }

  private expectIdentifier(): Token {
    const tok = this.peek();
    if (tok.type === "Identifier") {
      return this.advance();
    }
    throw new SyntaxError(`Expected identifier but got '${tok.value}' (${tok.type}) at line ${tok.line}:${tok.column}`);
  }

  private expectIdentifierOrKeyword(): Token {
    const tok = this.peek();
    if (tok.type === "Identifier" || tok.type === "Keyword") {
      return this.advance();
    }
    throw new SyntaxError(`Expected property name but got '${tok.value}' at line ${tok.line}:${tok.column}`);
  }

  private expectType(type: Token["type"]): Token {
    const tok = this.peek();
    if (tok.type === type) {
      return this.advance();
    }
    throw new SyntaxError(`Expected ${type} but got '${tok.value}' at line ${tok.line}:${tok.column}`);
  }
}
