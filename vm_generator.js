// File This Create by AZT Service : https://discord.gg/RneWWcMvG2
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VMGenerator = void 0;
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _rc4_runtime = require("./rc4_runtime");
var _rc4_statics = require("./rc4_statics");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
class VMGenerator {
  static cachedTemplate = null;
  static loadTemplate() {
    if (this.cachedTemplate !== null) {
      return this.cachedTemplate;
    }
    const candidatePaths = [path.resolve(__dirname, "../assets/lph_vm_template.lua"), path.resolve(__dirname, "./assets/lph_vm_template.lua"), path.resolve(process.cwd(), "assets/lph_vm_template.lua")];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        this.cachedTemplate = fs.readFileSync(p, "utf8");
        return this.cachedTemplate;
      }
    }
    throw new Error("AZT_OBFUSCATOR VM template not found in assets/lph_vm_template.lua");
  }
  static generateVM(lphPayload, checksum512) {
    const template = this.loadTemplate();
    const k3Runtime = _rc4_runtime.RC4Runtime.generateK3Runtime();
    const tWords = checksum512.words32.join(",");
    const body = template.replace("__AZT_N3_PAYLOAD__", () => lphPayload).replace("__AZT_K3_RUNTIME__", () => k3Runtime).replace("__AZT_T_CHECKSUM512__", () => tWords);
    return _rc4_statics.R4Statics.getStealthHeader() + "\n" + body;
  }
}
exports.VMGenerator = VMGenerator;
