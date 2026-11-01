# AZT_OBFUSCATOR — Roblox Luau Virtual Machine & AST Obfuscator

[![Official Website](https://img.shields.io/badge/Website-aztvn.top-00C7B7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://aztvn.top)
[![GitHub Repository](https://img.shields.io/badge/GitHub-AZT--Obfuscator--Soucre-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aztvn/AZT-Obfuscator-Soucre)
[![Package](https://img.shields.io/badge/Package-AZT__OBFUSCATOR-blue?style=for-the-badge)](https://github.com/aztvn/AZT-Obfuscator-Soucre)
[![Speed](https://img.shields.io/badge/Compile_Time-%3C_1s-orange?style=for-the-badge)](https://aztvn.top)
[![Discord Service](https://img.shields.io/badge/Discord-AZT_Service-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/RneWWcMvG2)
[![Discord Community](https://img.shields.io/badge/Discord-AZT_Protect-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/ADNSUAFDcx)

**`AZT_OBFUSCATOR`** is an enterprise-grade, sub-second **Roblox Luau Virtual Machine & Bytecode Obfuscator** built in **TypeScript and JavaScript**. It features a complete **Luau Lexer**, **Recursive-Descent + Pratt Parser**, **AST RCRuntime Binary Serializer**, **40-Opcode Polymorphic Intermediate Representation (IR)**, **Multi-Layer RC4 + SHA-256 + 512-Bit Cryptographic Checksum**, **Single-Payload Lazy Constant Pool (`local b={[1]="RC4KeyLazydecode",...}`)**, and a **Pure Luau Binary Bytecode VM Interpreter** powered by `pcall` with zero `loadstring` dependencies.

- **Official Website**: [https://aztvn.top](https://aztvn.top)
- **GitHub Repository**: [https://github.com/aztvn/AZT-Obfuscator-Soucre](https://github.com/aztvn/AZT-Obfuscator-Soucre)
- **Discord Server**: [https://discord.gg/RneWWcMvG2](https://discord.gg/RneWWcMvG2) · [https://discord.gg/ADNSUAFDcx](https://discord.gg/ADNSUAFDcx)

---

## Key Architecture & Security Features

### 1. Complete Roblox Luau Lexer & Parser (`src/lexer.ts`, `src/parser.ts`)
- Full support for modern Roblox Luau grammar: static type annotations (`param: boolean`, `list: { number }`, `: ReturnType`, `::` type assertions, `type` aliases), compound assignments (`+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `^=`, `..=`), floor division `//`, `continue` statements, inline `if-then-else` expressions, method declarations, closures, and variadic arguments `...`.
- Lossless binary-safe string tokenization supporting UTF-8 characters, multi-line long strings `[==[...]==]`, hex escapes `\xXX`, Unicode escapes `\u{...}`, decimal byte escapes `\ddd`, and null bytes `\0`.

### 2. Multi-Layer RC4 + SHA-256 + 512-Bit Checksum Engine (`src/rc4_statics.ts`)
- **512-Bit Checksum (`k.t`)**: Derives a 16-word (16 × 32-bit = 512-bit) cryptographic state table combining **SHA-256**, **SHA-512**, 32-bit left/right bit rotations (`bit32.lrotate`, `bit32.rrotate`), and bitwise XOR (`bit32.bxor`).
- **`LPH&` Base85 + Dictionary Compression (`d3` / `x3`)**: Packs the Constant Pool, encrypted AST RCRuntime binary stream, and polymorphic IR header into a single high-density `N3 = [==[LPH&...]==]` payload.
- **Anti-Tamper Integrity Verification**: Verifies the 512-bit checksum tag prior to container decryption; any modification to `k.t` or `N3` immediately halts VM execution.

### 3. Single-Payload Constant Pool & On-Demand Lazy Decoding
- **Pass 1 (Full Container RC4 Decode)**: Expands the `LPH&` dictionary payload into a binary `buffer` and decrypts the outer container in a single pass using an RC4 key schedule derived from the 512-bit Checksum.
- **Pass 2+ (Lazy Per-Constant Decode)**: Initializes `local b={[1]="RC4KeyLazydecode"}` with a custom `__index` metatable. Individual constants (strings, IEEE-754 64-bit numbers, identifiers, and property keys) remain encrypted in memory until first accessed via `b[idx]`, at which point their unique 32-bit key is derived from `k.t` + `bit32.lrotate` + `bit32.rrotate` + `bit32.bxor`, decrypted on the fly, and cached via `rawset`.

### 4. Pure Luau Binary Bytecode VM Interpreter (`src/rc4_runtime.ts`, `src/ast_rcruntime.ts`)
- **Zero `loadstring` Execution**: Eliminates `loadstring` and `load` from the VM runtime completely. All AST nodes and IR instructions are compiled into compact binary opcodes (`u8` + `u32` constant indices) and executed directly by an embedded Luau bytecode interpreter wrapped in `pcall`, preventing `loadstring` hooking and script dumping.
- **Universal Roblox Compatibility**: Runs seamlessly in **Roblox Studio**, **Roblox Client**, and **all Roblox Luau Executors** with full support for lexical upvalue cells, coroutines (`yield`/`resume`/`wrap`), metamethods, and Roblox userdata APIs (`game`, `workspace`, `Instance`, `Vector3`, `CFrame`, `Color3`, `UDim2`, `buffer`, `bit32`).

---

## Project Structure

```text
AZT_OBFUSCATOR/
├── .github/workflows/ci.yml   # GitHub Actions CI build pipeline
├── assets/
│   └── lph_vm_template.lua    # Polymorphic Luau VM dispatch template
├── dist/                      # Compiled CommonJS JavaScript modules
├── scripts/
│   └── build_ts.js            # Fast TypeScript-to-CommonJS compiler
├── src/
│   ├── types.ts               # AST, Token, IR, Constant Pool & Checksum512 definitions
│   ├── lexer.ts               # Roblox Luau Lexer (LuauLexer)
│   ├── parser.ts              # Recursive-Descent + Pratt Luau Parser (LuauParser)
│   ├── rc4_statics.ts         # R4Statics: RC4, SHA-256/512, 512-Bit Checksum, Lazy Pool, LPH&
│   ├── ast_rcruntime.ts       # ASTRCRuntime: Binary AST Serializer & RC4 Stream Encryptor
│   ├── ir.ts                  # IRCompiler: 40 Polymorphic VM Opcodes & CFG Builder
│   ├── rc4_runtime.ts         # RC4Runtime: Pure Luau Binary Bytecode VM Interpreter (pcall)
│   ├── vm_generator.ts        # VMGenerator: Emits setmetatable({...},{}):Z3()(...) output
│   ├── index.ts               # Main AZTObfuscator library entry point
│   └── cli.ts                 # Command-line interface (azt-obf)
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

---

## Installation & Usage

### Prerequisites
- **Node.js**: `>= 18.0.0`

### Clone & Build

```bash
git clone https://github.com/aztvn/AZT-Obfuscator-Soucre.git
cd AZT-Obfuscator-Soucre
npm run build
```

### Command-Line Interface (CLI)

```bash
node dist/cli.js path/to/script.lua path/to/output.obf.lua
```

### Programmatic API (TypeScript / JavaScript)

```typescript
// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
import { AZTObfuscator } from "./src/index";

const sourceCode = `
local Players = game:GetService("Players")
local function onPlayerAdded(player: any)
    print("Welcome:", player.Name)
end
Players.PlayerAdded:Connect(onPlayerAdded)
`;

const result = AZTObfuscator.obfuscate(sourceCode, {
  seed: 0x415a5435,
  rc4Layers: 3,
  enableLazyConstants: true,
  enableChecksum512: true,
  enableAstRCRuntime: true,
  minifyOutput: true
});

console.log(`Obfuscated in ${result.elapsedMs.toFixed(2)} ms`);
console.log(result.code);
```

---

## Output Format Example

```lua
-- This File Obfuscator by AZT [ https://discord.gg/ADNSUAFDcx ]
return setmetatable({C3=function(k,o,W,x)...end,[118]=(buffer and buffer.writei8),...,N3=[==[LPH&...]==],...,d3={["}"]="P`p<4",...},...,t={9272,3056608479,...},...,Z3=function(k,...)...end},{}):Z3()(...);
```

---

## Links & Official Channels

- **Website**: [https://aztvn.top](https://aztvn.top)
- **GitHub**: [https://github.com/aztvn/AZT-Obfuscator-Soucre](https://github.com/aztvn/AZT-Obfuscator-Soucre)
- **Discord (AZT Service)**: [https://discord.gg/RneWWcMvG2](https://discord.gg/RneWWcMvG2)
- **Discord (AZT Protect)**: [https://discord.gg/ADNSUAFDcx](https://discord.gg/ADNSUAFDcx)

---

## License

Released under the [MIT License](./LICENSE). Copyright © 2026 **AZT Service** ([https://aztvn.top](https://aztvn.top)).
