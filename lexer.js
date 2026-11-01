// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LuauLexer = void 0;
const LUAU_KEYWORDS = new Set(["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while"]);
const TWO_CHAR_OPS = new Set(["==", "~=", "<=", ">=", "..", "//", "+=", "-=", "*=", "/=", "%=", "^=", "::", "->"]);
const SINGLE_OPS = new Set(["+", "-", "*", "/", "%", "^", "#", "<", ">", "=", "&", "|", "?"]);
class LuauLexer {
  source;
  pos = 0;
  line = 1;
  col = 1;
  length;
  constructor(source) {
    this.source = source;
    this.length = source.length;
  }
  tokenize() {
    const tokens = [];
    if (this.source.charCodeAt(0) === 0xfeff) {
      this.pos++;
    }
    while (this.pos < this.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.length) break;
      const startPos = this.pos;
      const startLine = this.line;
      const startCol = this.col;
      const ch = this.source[this.pos];
      const code = this.source.charCodeAt(this.pos);
      if (this.isAlpha(code) || code === 95) {
        const ident = this.readIdentifier();
        const type = LUAU_KEYWORDS.has(ident) ? "Keyword" : "Identifier";
        tokens.push({
          type,
          value: ident,
          raw: ident,
          line: startLine,
          column: startCol,
          start: startPos,
          end: this.pos
        });
        continue;
      }
      if (this.isDigit(code) || code === 46 && this.pos + 1 < this.length && this.isDigit(this.source.charCodeAt(this.pos + 1))) {
        tokens.push(this.readNumber(startPos, startLine, startCol));
        continue;
      }
      if (ch === "'" || ch === '"') {
        tokens.push(this.readShortString(startPos, startLine, startCol));
        continue;
      }
      if (ch === "`") {
        tokens.push(this.readBacktickString(startPos, startLine, startCol));
        continue;
      }
      if (ch === "[") {
        const sepLen = this.checkLongBracket();
        if (sepLen >= 0) {
          tokens.push(this.readLongString(sepLen, startPos, startLine, startCol));
          continue;
        }
      }
      tokens.push(this.readOperatorOrPunctuation(startPos, startLine, startCol));
    }
    tokens.push({
      type: "EOF",
      value: "",
      raw: "",
      line: this.line,
      column: this.col,
      start: this.pos,
      end: this.pos
    });
    return tokens;
  }
  skipWhitespaceAndComments() {
    while (this.pos < this.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 32 || code === 9 || code === 13 || code === 12 || code === 11) {
        this.pos++;
        this.col++;
        continue;
      }
      if (code === 10) {
        this.pos++;
        this.line++;
        this.col = 1;
        continue;
      }
      if (code === 45 && this.source.charCodeAt(this.pos + 1) === 45) {
        this.pos += 2;
        this.col += 2;
        if (this.source.charCodeAt(this.pos) === 91) {
          const sepLen = this.checkLongBracket();
          if (sepLen >= 0) {
            this.readLongString(sepLen, this.pos, this.line, this.col);
            continue;
          }
        }
        while (this.pos < this.length && this.source.charCodeAt(this.pos) !== 10) {
          this.pos++;
          this.col++;
        }
        continue;
      }
      break;
    }
  }
  checkLongBracket() {
    if (this.source.charCodeAt(this.pos) !== 91) return -1;
    let p = this.pos + 1;
    let count = 0;
    while (p < this.length && this.source.charCodeAt(p) === 61) {
      count++;
      p++;
    }
    if (p < this.length && this.source.charCodeAt(p) === 91) {
      return count;
    }
    return -1;
  }
  readLongString(sepLen, startPos, startLine, startCol) {
    this.pos += 2 + sepLen;
    this.col += 2 + sepLen;
    if (this.source[this.pos] === "\r" && this.source[this.pos + 1] === "\n") {
      this.pos += 2;
      this.line++;
      this.col = 1;
    } else if (this.source[this.pos] === "\n" || this.source[this.pos] === "\r") {
      this.pos++;
      this.line++;
      this.col = 1;
    }
    const contentStart = this.pos;
    let contentEnd = this.pos;
    while (this.pos < this.length) {
      if (this.source.charCodeAt(this.pos) === 93) {
        let p = this.pos + 1;
        let eq = 0;
        while (eq < sepLen && p < this.length && this.source.charCodeAt(p) === 61) {
          eq++;
          p++;
        }
        if (eq === sepLen && p < this.length && this.source.charCodeAt(p) === 93) {
          contentEnd = this.pos;
          this.pos = p + 1;
          this.col += 2 + sepLen;
          const rawContent = this.source.slice(contentStart, contentEnd).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
          const utf8Bytes = Buffer.from(rawContent, "utf8");
          const byteStr = utf8Bytes.toString("latin1");
          return {
            type: "String",
            value: byteStr,
            raw: this.source.slice(startPos, this.pos),
            line: startLine,
            column: startCol,
            start: startPos,
            end: this.pos
          };
        }
      }
      if (this.source.charCodeAt(this.pos) === 10) {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
      this.pos++;
    }
    throw new SyntaxError(`Unfinished long string starting at line ${startLine}:${startCol}`);
  }
  readShortString(startPos, startLine, startCol) {
    const quote = this.source[this.pos];
    this.pos++;
    this.col++;
    while (this.pos < this.length) {
      const ch = this.source[this.pos];
      if (ch === quote) {
        this.pos++;
        this.col++;
        const rawSlice = this.source.slice(startPos, this.pos);
        const decoded = this.decodeEscapeStringToByteString(rawSlice.slice(1, -1));
        return {
          type: "String",
          value: decoded,
          raw: rawSlice,
          line: startLine,
          column: startCol,
          start: startPos,
          end: this.pos
        };
      }
      if (ch === "\\") {
        this.pos++;
        this.col++;
        if (this.pos >= this.length) break;
        const esc = this.source[this.pos];
        if (esc === "\r" && this.source[this.pos + 1] === "\n") {
          this.pos += 2;
          this.line++;
          this.col = 1;
        } else if (esc === "\n" || esc === "\r") {
          this.pos++;
          this.line++;
          this.col = 1;
        } else {
          this.pos++;
          this.col++;
        }
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        throw new SyntaxError(`Unfinished string at line ${this.line}:${this.col}`);
      }
      this.pos++;
      this.col++;
    }
    throw new SyntaxError(`Unfinished string starting at line ${startLine}:${startCol}`);
  }
  decodeEscapeStringToByteString(inner) {
    const bytes = [];
    let i = 0;
    while (i < inner.length) {
      const ch = inner[i];
      if (ch !== "\\") {
        const cp = inner.codePointAt(i);
        const charStr = String.fromCodePoint(cp);
        const buf = Buffer.from(charStr, "utf8");
        for (let b = 0; b < buf.length; b++) {
          bytes.push(buf[b]);
        }
        i += charStr.length;
        continue;
      }
      i++;
      if (i >= inner.length) break;
      const esc = inner[i];
      switch (esc) {
        case "a":
          bytes.push(7);
          i++;
          break;
        case "b":
          bytes.push(8);
          i++;
          break;
        case "f":
          bytes.push(12);
          i++;
          break;
        case "n":
          bytes.push(10);
          i++;
          break;
        case "r":
          bytes.push(13);
          i++;
          break;
        case "t":
          bytes.push(9);
          i++;
          break;
        case "v":
          bytes.push(11);
          i++;
          break;
        case "\\":
          bytes.push(92);
          i++;
          break;
        case '"':
          bytes.push(34);
          i++;
          break;
        case "'":
          bytes.push(39);
          i++;
          break;
        case "\n":
          bytes.push(10);
          i++;
          break;
        case "\r":
          if (inner[i + 1] === "\n") i++;
          bytes.push(10);
          i++;
          break;
        case "z":
          i++;
          while (i < inner.length && /\s/.test(inner[i])) i++;
          break;
        case "x":
          {
            const hex = inner.slice(i + 1, i + 3);
            const val = parseInt(hex, 16);
            bytes.push((Number.isNaN(val) ? 0 : val) & 0xff);
            i += 3;
            break;
          }
        case "u":
          {
            if (inner[i + 1] === "{") {
              const closeIdx = inner.indexOf("}", i + 2);
              if (closeIdx !== -1) {
                const codePoint = parseInt(inner.slice(i + 2, closeIdx), 16);
                const utf8 = Buffer.from(String.fromCodePoint(codePoint), "utf8");
                for (let b = 0; b < utf8.length; b++) bytes.push(utf8[b]);
                i = closeIdx + 1;
                break;
              }
            }
            bytes.push(117);
            i++;
            break;
          }
        default:
          {
            if (esc >= "0" && esc <= "9") {
              let numStr = esc;
              i++;
              if (i < inner.length && inner[i] >= "0" && inner[i] <= "9") {
                numStr += inner[i];
                i++;
                if (i < inner.length && inner[i] >= "0" && inner[i] <= "9") {
                  numStr += inner[i];
                  i++;
                }
              }
              const byteVal = parseInt(numStr, 10);
              bytes.push(byteVal & 0xff);
            } else {
              const utf8 = Buffer.from(esc, "utf8");
              for (let b = 0; b < utf8.length; b++) bytes.push(utf8[b]);
              i++;
            }
            break;
          }
      }
    }
    return Buffer.from(bytes).toString("latin1");
  }
  readBacktickString(startPos, startLine, startCol) {
    this.pos++;
    this.col++;
    while (this.pos < this.length && this.source[this.pos] !== "`") {
      if (this.source[this.pos] === "\\") {
        this.pos += 2;
        this.col += 2;
        continue;
      }
      this.pos++;
      this.col++;
    }
    if (this.pos < this.length) {
      this.pos++;
      this.col++;
    }
    const raw = this.source.slice(startPos, this.pos);
    return {
      type: "String",
      value: this.decodeEscapeStringToByteString(raw.slice(1, -1)),
      raw,
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos
    };
  }
  readIdentifier() {
    const start = this.pos;
    while (this.pos < this.length) {
      const code = this.source.charCodeAt(this.pos);
      if (this.isAlphaNum(code) || code === 95) {
        this.pos++;
        this.col++;
      } else {
        break;
      }
    }
    return this.source.slice(start, this.pos);
  }
  readNumber(startPos, startLine, startCol) {
    if (this.source[this.pos] === "0" && (this.source[this.pos + 1] === "x" || this.source[this.pos + 1] === "X")) {
      this.pos += 2;
      this.col += 2;
      while (this.pos < this.length && (this.isHexDigit(this.source.charCodeAt(this.pos)) || this.source[this.pos] === "_")) {
        this.pos++;
        this.col++;
      }
    } else if (this.source[this.pos] === "0" && (this.source[this.pos + 1] === "b" || this.source[this.pos + 1] === "B")) {
      this.pos += 2;
      this.col += 2;
      while (this.pos < this.length && (this.source[this.pos] === "0" || this.source[this.pos] === "1" || this.source[this.pos] === "_")) {
        this.pos++;
        this.col++;
      }
    } else {
      while (this.pos < this.length && (this.isDigit(this.source.charCodeAt(this.pos)) || this.source[this.pos] === "_")) {
        this.pos++;
        this.col++;
      }
      if (this.pos < this.length && this.source[this.pos] === "." && this.source[this.pos + 1] !== ".") {
        this.pos++;
        this.col++;
        while (this.pos < this.length && (this.isDigit(this.source.charCodeAt(this.pos)) || this.source[this.pos] === "_")) {
          this.pos++;
          this.col++;
        }
      }
      if (this.pos < this.length && (this.source[this.pos] === "e" || this.source[this.pos] === "E")) {
        this.pos++;
        this.col++;
        if (this.source[this.pos] === "+" || this.source[this.pos] === "-") {
          this.pos++;
          this.col++;
        }
        while (this.pos < this.length && (this.isDigit(this.source.charCodeAt(this.pos)) || this.source[this.pos] === "_")) {
          this.pos++;
          this.col++;
        }
      }
    }
    const raw = this.source.slice(startPos, this.pos);
    return {
      type: "Number",
      value: raw.replace(/_/g, ""),
      raw,
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos
    };
  }
  readOperatorOrPunctuation(startPos, startLine, startCol) {
    const s3 = this.source.slice(this.pos, this.pos + 3);
    if (s3 === "..." || s3 === "..=" || s3 === "//=") {
      this.pos += 3;
      this.col += 3;
      return {
        type: s3 === "..." ? "Punctuation" : "Operator",
        value: s3,
        raw: s3,
        line: startLine,
        column: startCol,
        start: startPos,
        end: this.pos
      };
    }
    const s2 = this.source.slice(this.pos, this.pos + 2);
    if (TWO_CHAR_OPS.has(s2)) {
      this.pos += 2;
      this.col += 2;
      return {
        type: "Operator",
        value: s2,
        raw: s2,
        line: startLine,
        column: startCol,
        start: startPos,
        end: this.pos
      };
    }
    const s1 = this.source[this.pos];
    this.pos++;
    this.col++;
    return {
      type: SINGLE_OPS.has(s1) ? "Operator" : "Punctuation",
      value: s1,
      raw: s1,
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos
    };
  }
  isAlpha(code) {
    return code >= 65 && code <= 90 || code >= 97 && code <= 122;
  }
  isDigit(code) {
    return code >= 48 && code <= 57;
  }
  isAlphaNum(code) {
    return this.isAlpha(code) || this.isDigit(code);
  }
  isHexDigit(code) {
    return this.isDigit(code) || code >= 65 && code <= 70 || code >= 97 && code <= 102;
  }
}
exports.LuauLexer = LuauLexer;
