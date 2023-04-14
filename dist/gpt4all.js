"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/gpt4all.ts
var gpt4all_exports = {};
__export(gpt4all_exports, {
  GPT4All: () => GPT4All
});
module.exports = __toCommonJS(gpt4all_exports);
var import_child_process = require("child_process");
var import_util = require("util");
var fs = __toESM(require("fs"));
var os = __toESM(require("os"));
var import_axios = __toESM(require("axios"));
var import_progress = __toESM(require("progress"));
var import_debug = __toESM(require("debug"));
var debugging = (0, import_debug.default)("gpt4all");
var GPT4All = class {
  constructor(model = "gpt4all-lora-quantized", forceDownload = false, decoderConfig = {}) {
    this.bot = null;
    this.model = model;
    this.decoderConfig = decoderConfig;
    if ("gpt4all-lora-quantized" !== model && "gpt4all-lora-unfiltered-quantized" !== model) {
      throw new Error(`Model ${model} is not supported. Current models supported are: 
                gpt4all-lora-quantized
                gpt4all-lora-unfiltered-quantized`);
    }
    this.executablePath = `${os.homedir()}/.nomic/gpt4all`;
    this.modelPath = `${os.homedir()}/.nomic/${model}.bin`;
  }
  init(forceDownload = false) {
    return __async(this, null, function* () {
      const downloadPromises = [];
      if (forceDownload || !fs.existsSync(this.executablePath)) {
        downloadPromises.push(this.downloadExecutable());
      }
      if (forceDownload || !fs.existsSync(this.modelPath)) {
        downloadPromises.push(this.downloadModel());
      }
      yield Promise.all(downloadPromises);
    });
  }
  open() {
    return __async(this, null, function* () {
      if (this.bot !== null) {
        this.close();
      }
      let spawnArgs = [this.executablePath, "--model", this.modelPath];
      for (let [key, value] of Object.entries(this.decoderConfig)) {
        spawnArgs.push(`--${key}`, value.toString());
      }
      this.bot = (0, import_child_process.spawn)(spawnArgs[0], spawnArgs.slice(1), {
        stdio: ["pipe", "pipe", "ignore"]
      });
      yield new Promise((resolve) => {
        var _a, _b;
        (_b = (_a = this.bot) == null ? void 0 : _a.stdout) == null ? void 0 : _b.on("data", (data) => {
          if (data.toString().includes(">")) {
            resolve(true);
          }
        });
      });
    });
  }
  close() {
    if (this.bot !== null) {
      this.bot.kill();
      this.bot = null;
    }
  }
  downloadExecutable() {
    return __async(this, null, function* () {
      let upstream;
      const platform2 = os.platform();
      if (platform2 === "darwin") {
        const { stdout } = yield (0, import_util.promisify)(import_child_process.exec)("uname -m");
        if (stdout.trim() === "arm64") {
          upstream = "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-OSX-m1?raw=true";
        } else {
          upstream = "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-OSX-intel?raw=true";
        }
      } else if (platform2 === "linux") {
        upstream = "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-linux-x86?raw=true";
      } else if (platform2 === "win32") {
        upstream = "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-win64.exe?raw=true";
      } else {
        throw new Error(
          `Your platform is not supported: ${platform2}. Current binaries supported are for OSX (ARM and Intel), Linux and Windows.`
        );
      }
      yield this.downloadFile(upstream, this.executablePath);
      fs.chmod(this.executablePath, 493, (err) => {
        if (err) {
          throw err;
        }
      });
      debugging(`File downloaded successfully to ${this.executablePath}`);
    });
  }
  downloadModel() {
    return __async(this, null, function* () {
      const modelUrl = `https://the-eye.eu/public/AI/models/nomic-ai/gpt4all/${this.model}.bin`;
      yield this.downloadFile(modelUrl, this.modelPath);
      debugging(`File downloaded successfully to ${this.modelPath}`);
    });
  }
  downloadFile(url, destination) {
    return __async(this, null, function* () {
      const { data, headers } = yield import_axios.default.get(url, { responseType: "stream" });
      const totalSize = parseInt(headers["content-length"], 10);
      const progressBar = new import_progress.default("[:bar] :percent :etas", {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: totalSize
      });
      const dir = new URL(`file://${os.homedir()}/.nomic/`);
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) {
          throw err;
        }
      });
      const writer = fs.createWriteStream(destination);
      data.on("data", (chunk) => {
        progressBar.tick(chunk.length);
      });
      data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    });
  }
  prompt(prompt) {
    var _a, _b;
    if (this.bot === null) {
      throw new Error("Bot is not initialized.");
    }
    (_b = (_a = this.bot) == null ? void 0 : _a.stdin) == null ? void 0 : _b.write(prompt + "\n");
    return new Promise((resolve, reject) => {
      var _a2, _b2, _c, _d;
      let response = "";
      let timeoutId;
      const onStdoutData = (data) => {
        const text = data.toString();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          debugging("Timeout reached - Resolving...");
          terminateAndResolve(response);
        }, 4e3);
        debugging("Received text:", text);
        response += text;
        debugging("Updated response:", response);
      };
      const onStdoutError = (err) => {
        var _a3, _b3, _c2, _d2;
        (_b3 = (_a3 = this.bot) == null ? void 0 : _a3.stdout) == null ? void 0 : _b3.removeListener("data", onStdoutData);
        (_d2 = (_c2 = this.bot) == null ? void 0 : _c2.stdout) == null ? void 0 : _d2.removeListener("error", onStdoutError);
        reject(err);
      };
      const terminateAndResolve = (finalResponse) => {
        var _a3, _b3, _c2, _d2;
        (_b3 = (_a3 = this.bot) == null ? void 0 : _a3.stdout) == null ? void 0 : _b3.removeListener("data", onStdoutData);
        (_d2 = (_c2 = this.bot) == null ? void 0 : _c2.stdout) == null ? void 0 : _d2.removeListener("error", onStdoutError);
        resolve(finalResponse);
      };
      (_b2 = (_a2 = this.bot) == null ? void 0 : _a2.stdout) == null ? void 0 : _b2.on("data", onStdoutData);
      (_d = (_c = this.bot) == null ? void 0 : _c.stdout) == null ? void 0 : _d.on("error", onStdoutError);
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GPT4All
});
