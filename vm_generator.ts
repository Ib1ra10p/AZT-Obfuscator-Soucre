// File This Create by AZT Service : https://discord.gg/RneWWcMvG2

import * as fs from "fs";
import * as path from "path";
import { RC4Runtime } from "./rc4_runtime";
import { R4Statics } from "./rc4_statics";
import { Checksum512State } from "./types";

export class VMGenerator {
  private static cachedTemplate: string | null = null;

  private static loadTemplate(): string {
    if (this.cachedTemplate !== null) {
      return this.cachedTemplate;
    }
    const candidatePaths = [
      path.resolve(__dirname, "../assets/lph_vm_template.lua"),
      path.resolve(__dirname, "./assets/lph_vm_template.lua"),
      path.resolve(process.cwd(), "assets/lph_vm_template.lua")
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        this.cachedTemplate = fs.readFileSync(p, "utf8");
        return this.cachedTemplate;
      }
    }
    throw new Error("AZT_OBFUSCATOR VM template not found in assets/lph_vm_template.lua");
  }

  public static generateVM(lphPayload: string, checksum512: Checksum512State): string {
    const template = this.loadTemplate();
    const k3Runtime = RC4Runtime.generateK3Runtime();
    const tWords = checksum512.words32.join(",");

    const body = template
      .replace("__AZT_N3_PAYLOAD__", () => lphPayload)
      .replace("__AZT_K3_RUNTIME__", () => k3Runtime)
      .replace("__AZT_T_CHECKSUM512__", () => tWords);
    return R4Statics.getStealthHeader() + "\n" + body;
  }
}
