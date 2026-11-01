// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

import * as crypto from "crypto";
import { Checksum512State, ConstantPoolEntry } from "./types";

export class R4Statics {
  public static readonly LPH_DICTIONARY: Record<string, string> = {
    "}": "P`p<4",
    "~": "G7r<t",
    "%": "gD\\dU",
    "!": "t90h_",
    "#": "f-VO4",
    "{": "(B9,u",
    "|": "VZRg?",
    " ": "]LTn5",
    "\"": "V2dp4",
    "$": "N)\\W^"
  };


  private static readonly _S0: number[] = [84,246,121,122,125,22,103,158,139,83,28,246,189,37,238,40,147,2,96,215,158,33,107,152,168,214,125,209,108,250,250,196,60,216,221,125,187,194,47,226,196,61,48,66,165,32,110,60,75,162,68,163,55,126,136,3,21,19,72,253,167,153,254,242];
  private static readonly _S1: number[] = [232,166,101,72,26,229,48,159,125,104,200,146,27,96];
  private static readonly _S2: number[] = [15,93,98,27,109];
  private static readonly _S3: number[] = [83,32,255,30,114,210,122,33,223,100,176,146,11,64,157,95,80,103,163,72,119,236,230,231,247,26,34,53,216,126,173,72,82,28,33,132,173,161,146,227,113,254,229,124,11,196,251,217,236,31,33,164,1,219,13,60,254,68,67,154,221,239,134,101,238,160,90,128];
  private static readonly _S4: number[] = [50,148,95,153,91,52,1,188,109,177,58,148,155,7,15,14,241,100,66,49,188,7,9,190,75,49,95,183,78,220,24,226,94,190,255,156,157,224,73,192,34,223,22,32,131,2,137,30,45,192,98,65,17,92,238,33,244,242,106,155,133,191,28,212,11,154,37,32,23,28,155,67,84,41,254,69,33,144,11,227,203,21,132,113,44,121,233,196,255,251,164,178,75,221,231,135,94,130,203,62,7,129,151,110,248,2,226,72,117,204,187,56,251,184,118,79,26,85,11,40,37,111,29,174,68,241,243,95,218,180,95,16,107,92,67,71,101,32,74,101,3,151,246,212,249,108,242,17,198,134,160,101,75,32,255,87,118,63,10,226,246,23,21,230];
  private static readonly _S6: number[] = [248,70,21,88,66,29,200,182,108,129];
  private static readonly _S5: number[] = [58,133,38,11,74,43,194,81,109,223,1,235,194,107,117,222,88,69,211,16,229,206,240,93,104,248,130,143,225,191,172,202,178,239,8,175,77,233,18,25,19,148,111,193,114,115,112,94,76,157,113,52,145,99,173,190,247,69,67,186,205,118,207,206,128,184];

  public static decodeStealth(arr: readonly number[], key: number): string {
    const out = Buffer.alloc(arr.length);
    for (let i = 0; i < arr.length; i++) {
      const rot = arr[i] & 0xff;
      const x = ((rot >>> 3) | (rot << 5)) & 0xff;
      const k = ((key + i * 0x3d) ^ (i * 0x17)) & 0xff;
      out[i] = (x ^ k) & 0xff;
    }
    return out.toString("utf8");
  }

  public static getStealthHeader(): string {
    return this.decodeStealth(this._S0, 0xa7);
  }

  public static getStealthGlobalName(): string {
    return this.decodeStealth(this._S1, 0x5c);
  }

  public static getStealthPrintName(): string {
    return this.decodeStealth(this._S2, 0x91);
  }

  public static getStealthLoaderName(): string {
    return this.decodeStealth(this._S6, 0x73);
  }

  public static getStealthProtectBanner(): string {
    return this.decodeStealth(this._S3, 0x3e);
  }

  public static getStealthPrologue(): string {
    return this.decodeStealth(this._S4, 0x6b);
  }

  public static getStealthEpilogue(): string {
    return this.decodeStealth(this._S5, 0x4d);
  }

  public static u32(n: number): number {
    return n >>> 0;
  }

  public static bxor32(a: number, b: number): number {
    return (a ^ b) >>> 0;
  }

  public static bxor3(a: number, b: number, c: number): number {
    return (a ^ b ^ c) >>> 0;
  }

  public static rotl32(val: number, shift: number): number {
    const s = shift & 31;
    if (s === 0) return val >>> 0;
    return ((val << s) | (val >>> (32 - s))) >>> 0;
  }

  public static rotr32(val: number, shift: number): number {
    const s = shift & 31;
    if (s === 0) return val >>> 0;
    return ((val >>> s) | (val << (32 - s))) >>> 0;
  }

  public static computeSHA256(data: Uint8Array | string): Buffer {
    return crypto.createHash("sha256").update(data).digest();
  }

  public static computeSHA512(data: Uint8Array | string): Buffer {
    return crypto.createHash("sha512").update(data).digest();
  }

  public static generateChecksum512(payload: Uint8Array | string, seed: number = 0x5a7f1337): Checksum512State {
    const sha256Buf = this.computeSHA256(payload);
    const sha512Buf = this.computeSHA512(payload);

    const words32: number[] = [];
    for (let i = 0; i < 16; i++) {
      const w512 = sha512Buf.readUInt32LE((i * 4) % 64);
      const w256 = sha256Buf.readUInt32LE((i * 4) % 32);
      const mixed = this.bxor32(
        this.rotl32(w512, (i * 3 + 5) & 31),
        this.rotr32((w256 ^ ((seed + i * 0x9e3779b9) >>> 0)) >>> 0, (i * 5 + 7) & 31)
      );
      words32.push(i === 0 ? (mixed & 0xffff) : mixed >>> 0);
    }

    return {
      words32,
      sha256Hex: sha256Buf.toString("hex"),
      sha512Hex: sha512Buf.toString("hex"),
      masterSeed: seed >>> 0
    };
  }

  public static rc4KSA(key: Uint8Array): Uint8Array {
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) S[i] = i;
    let j = 0;
    const keyLen = key.length;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key[i % keyLen]) & 0xff;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
    }
    return S;
  }

  public static rc4Crypt(data: Uint8Array, key: Uint8Array): Uint8Array {
    const S = this.rc4KSA(key);
    const out = new Uint8Array(data.length);
    let i = 0;
    let j = 0;
    for (let k = 0; k < data.length; k++) {
      i = (i + 1) & 0xff;
      j = (j + S[i]) & 0xff;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
      const rnd = S[(S[i] + S[j]) & 0xff];
      out[k] = (data[k] ^ rnd) & 0xff;
    }
    return out;
  }

  public static encryptLazyConstant(
    rawBytes: Uint8Array,
    poolIndex: number,
    checksumWords: number[]
  ): { encryptedBytes: Uint8Array; lazyKey32: number; rotateShift: number; checksumWordIndex: number } {
    const checksumWordIndex = ((poolIndex - 1) % checksumWords.length) + 1;
    const baseWord = checksumWords[checksumWordIndex - 1] >>> 0;
    const rotateShift = ((poolIndex * 7 + 3) % 13) + 1;
    const rotated = this.rotl32(baseWord, rotateShift);
    const mask = this.rotr32((poolIndex * 93901) >>> 0, (rotateShift % 7) + 1);
    const lazyKey32 = this.bxor32(rotated, mask);

    const out = new Uint8Array(rawBytes.length);
    let state = lazyKey32 % 268435456;
    for (let i = 0; i < rawBytes.length; i++) {
      state = (829307 * state + 160273017) % 268435456;
      const rotWord = this.rotl32(lazyKey32, (i % 7) + 1);
      const rotByte = (rotWord >>> ((i & 3) * 8)) & 0xff;
      const lcgByte = (state >>> 12) & 0xff;
      const keyByte = (lcgByte ^ rotByte ^ ((i * 41) & 0xff)) & 0xff;
      out[i] = (rawBytes[i] ^ keyByte) & 0xff;
    }

    return {
      encryptedBytes: out,
      lazyKey32,
      rotateShift,
      checksumWordIndex
    };
  }

  public static encodeLPH(data: Uint8Array): string {
    const padLen = (4 - (data.length & 3)) & 3;
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data, 0);

    const chars: string[] = [];
    for (let i = 0; i < padded.length; i += 4) {
      let w =
        (padded[i] |
          (padded[i + 1] << 8) |
          (padded[i + 2] << 16) |
          (padded[i + 3] << 24)) >>>
        0;
      const c0 = (w % 85) + 38;
      w = Math.floor(w / 85);
      const c1 = (w % 85) + 38;
      w = Math.floor(w / 85);
      const c2 = (w % 85) + 38;
      w = Math.floor(w / 85);
      const c3 = (w % 85) + 38;
      w = Math.floor(w / 85);
      const c4 = (w % 85) + 38;
      chars.push(String.fromCharCode(c4, c3, c2, c1, c0));
    }

    let encoded = chars.join("");
    for (const [shortChar, fiveCharSeq] of Object.entries(this.LPH_DICTIONARY)) {
      encoded = encoded.split(fiveCharSeq).join(shortChar);
    }

    return "LPH&" + encoded;
  }

  public static encodeFullLPHPayload(
    pool: ConstantPoolBuilder,
    encryptedASTBytes: Uint8Array,
    serializedIR: Uint8Array,
    checksum512: Checksum512State,
    nonce32: number
  ): { lphPayload: string; containerBytes: Uint8Array } {
    const poolBytes = pool.serializePackedPool();
    const totalInner = poolBytes.length + encryptedASTBytes.length + serializedIR.length;
    const innerPlain = new Uint8Array(totalInner);
    innerPlain.set(poolBytes, 0);
    innerPlain.set(encryptedASTBytes, poolBytes.length);
    innerPlain.set(serializedIR, poolBytes.length + encryptedASTBytes.length);

    const containerKey = new Uint8Array(16);
    const uNonce = nonce32 >>> 0;
    for (let m = 0; m < 16; m++) {
      const d = checksum512.words32[m] >>> 0;
      const z = (uNonce >>> ((m % 4) * 8)) & 0xff;
      containerKey[m] = (d ^ z) & 0xff;
    }

    const encryptedInner = this.rc4Crypt(innerPlain, containerKey);
    const containerBytes = new Uint8Array(20 + encryptedInner.length);
    const view = new DataView(containerBytes.buffer);
    const checksumTag = (checksum512.words32[0] ^ checksum512.words32[1]) >>> 0;

    view.setUint32(0, checksumTag, true);
    view.setUint32(4, uNonce, true);
    view.setUint32(8, poolBytes.length, true);
    view.setUint32(12, encryptedASTBytes.length, true);
    view.setUint32(16, serializedIR.length, true);
    containerBytes.set(encryptedInner, 20);

    const lphPayload = this.encodeLPH(containerBytes);
    return { lphPayload, containerBytes };
  }
}

export class ConstantPoolBuilder {
  private entries: ConstantPoolEntry[] = [];
  private indexMap = new Map<string, number>();
  private checksumWords: number[];

  constructor(checksumWords: number[]) {
    this.checksumWords = checksumWords;
    this.addString("RC4KeyLazydecode");
    this.addString(R4Statics.getStealthHeader());
    this.addString(R4Statics.getStealthGlobalName());
    this.addString(R4Statics.getStealthPrintName());
    this.addString(R4Statics.getStealthProtectBanner());
    this.addString(R4Statics.getStealthLoaderName());
  }

  public addString(val: string): number {
    const key = `S:${val}`;
    const existing = this.indexMap.get(key);
    if (existing !== undefined) return existing;

    const index = this.entries.length + 1;
    const rawBytes = new Uint8Array(val.length);
    for (let i = 0; i < val.length; i++) {
      rawBytes[i] = val.charCodeAt(i) & 0xff;
    }

    const enc = R4Statics.encryptLazyConstant(rawBytes, index, this.checksumWords);
    this.entries.push({
      index,
      type: "string",
      value: val,
      encryptedBytes: enc.encryptedBytes,
      lazyKey32: enc.lazyKey32,
      rotateShift: enc.rotateShift,
      checksumWordIndex: enc.checksumWordIndex
    });
    this.indexMap.set(key, index);
    return index;
  }

  public addNumber(val: number): number {
    const key = `N:${Object.is(val, -0) ? "-0" : val}`;
    const existing = this.indexMap.get(key);
    if (existing !== undefined) return existing;

    const index = this.entries.length + 1;
    const buf = Buffer.alloc(8);
    buf.writeDoubleLE(val, 0);
    const rawBytes = new Uint8Array(buf);

    const enc = R4Statics.encryptLazyConstant(rawBytes, index, this.checksumWords);
    this.entries.push({
      index,
      type: "number",
      value: val,
      encryptedBytes: enc.encryptedBytes,
      lazyKey32: enc.lazyKey32,
      rotateShift: enc.rotateShift,
      checksumWordIndex: enc.checksumWordIndex
    });
    this.indexMap.set(key, index);
    return index;
  }

  public getEntries(): ConstantPoolEntry[] {
    return this.entries;
  }

  public serializePackedPool(): Uint8Array {
    let totalLen = 4;
    for (const entry of this.entries) {
      totalLen += 7 + entry.encryptedBytes.length;
    }

    const out = new Uint8Array(totalLen);
    const view = new DataView(out.buffer);
    view.setUint32(0, this.entries.length, true);

    let offset = 4;
    for (const entry of this.entries) {
      out[offset] = entry.type === "string" ? 1 : 2;
      out[offset + 1] = entry.rotateShift & 0xff;
      out[offset + 2] = entry.checksumWordIndex & 0xff;
      view.setUint32(offset + 3, entry.encryptedBytes.length, true);
      out.set(entry.encryptedBytes, offset + 7);
      offset += 7 + entry.encryptedBytes.length;
    }

    return out;
  }
}
