# Changelog

## [1.0.0] - 2026-11-01
### Added
- Complete Roblox Luau Lexer (`LuauLexer`) and Recursive-Descent + Pratt Parser (`LuauParser`).
- Static type stripping, compound assignment lowering (`+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `^=`, `..=`), floor division `//`, and `continue` support.
- Multi-layer RC4 stream cipher, SHA-256, 512-Bit Checksum (`R4Statics`), and `LPH&` Base85 + `d3` dictionary payload compression.
- Single-payload Constant Pool with 1-time full container RC4 decode and on-demand lazy constant decoding (`local b={[1]="RC4KeyLazydecode",...}`) using keys embedded in the 512-bit Checksum + `bit32.bxor` + `bit32.lrotate`/`rrotate`.
- Pure Luau Binary Bytecode VM Interpreter (`RC4Runtime`) using `pcall` with zero `loadstring` dependencies and full Roblox Studio / Executor compatibility.
