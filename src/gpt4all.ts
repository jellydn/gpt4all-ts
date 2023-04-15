import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import cliProgress from "cli-progress";
import got from "got";
import debug from "debug";
import { URL } from "url";

const debugging = debug("gpt4all");

const downloadFile = async (
  url: string | URL | undefined,
  path: fs.PathLike
) => {
  debugging(`Downloading ${url} to ${path}`);
  const stream = fs.createWriteStream(path);
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(100, 0);
  const response = got.stream(url);
  let totalLength = 0;
  let downloadedLength = 0;

  response.on("downloadProgress", (progress) => {
    downloadedLength = progress.transferred;
    totalLength = progress.total;
    if (totalLength === 0) return;

    const progressPercent = (downloadedLength / totalLength) * 100;
    progressBar.update(progressPercent);
  });

  response.pipe(stream);

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      progressBar.stop();
      resolve(url);
    });
    stream.on("error", reject);
  });
};

export class GPT4All {
  private bot: ReturnType<typeof spawn> | null = null;
  private model: string;
  private decoderConfig: Record<string, any>;
  private executablePath: string;
  private modelPath: string;

  constructor(
    model: string = "gpt4all-lora-quantized",
    decoderConfig: Record<string, any> = {}
  ) {
    this.model = model;
    this.decoderConfig = decoderConfig;
    /* 
    allowed models: 
    M1 Mac/OSX: cd chat;./gpt4all-lora-quantized-OSX-m1
Linux: cd chat;./gpt4all-lora-quantized-linux-x86
Windows (PowerShell): cd chat;./gpt4all-lora-quantized-win64.exe
Intel Mac/OSX: cd chat;./gpt4all-lora-quantized-OSX-intel
    */
    if (
      "gpt4all-lora-quantized" !== model &&
      "gpt4all-lora-unfiltered-quantized" !== model
    ) {
      throw new Error(`Model ${model} is not supported. Current models supported are: 
                gpt4all-lora-quantized
                gpt4all-lora-unfiltered-quantized`);
    }

    this.executablePath =
      os.platform() === "win32"
        ? `${os.homedir()}/.nomic/gpt4all.exe`
        : `${os.homedir()}/.nomic/gpt4all`;
    this.modelPath = `${os.homedir()}/.nomic/${model}.bin`;
  }

  async init(forceDownload: boolean = false): Promise<void> {
    debugging("Initializing GPT4All");

    if (forceDownload || !fs.existsSync(this.executablePath)) {
      await this.downloadExecutable();
    }

    if (forceDownload || !fs.existsSync(this.modelPath)) {
      await this.downloadModel();
    }
  }

  public async open(): Promise<void> {
    debugging("Opening GPT4All");
    if (this.bot !== null) {
      this.close();
    }

    let spawnArgs = [this.executablePath, "--model", this.modelPath];

    for (let [key, value] of Object.entries(this.decoderConfig)) {
      spawnArgs.push(`--${key}`, value.toString());
    }

    this.bot = spawn(spawnArgs[0], spawnArgs.slice(1), {
      stdio: ["pipe", "pipe", "ignore"],
    });
    // wait for the bot to be ready
    await new Promise((resolve) => {
      this.bot?.stdout?.on("data", (data) => {
        if (data.toString().includes(">")) {
          resolve(true);
        }
      });
    });
  }

  public close(): void {
    debugging("Closing GPT4All");
    if (this.bot !== null) {
      this.bot.kill();
      this.bot = null;
    }
  }

  private async downloadExecutable() {
    debugging("Downloading GPT4All executable");
    let upstream: string;
    const platform = os.platform();

    if (platform === "darwin") {
      // check for M1 Mac
      const { stdout } = await promisify(exec)("uname -m");
      if (stdout.trim() === "arm64") {
        upstream =
          "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-OSX-m1?raw=true";
      } else {
        upstream =
          "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-OSX-intel?raw=true";
      }
    } else if (platform === "linux") {
      upstream =
        "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-linux-x86?raw=true";
    } else if (platform === "win32") {
      upstream =
        "https://github.com/nomic-ai/gpt4all/blob/main/chat/gpt4all-lora-quantized-win64.exe?raw=true";
    } else {
      throw new Error(
        `Your platform is not supported: ${platform}. Current binaries supported are for OSX (ARM and Intel), Linux and Windows.`
      );
    }

    await downloadFile(upstream, this.executablePath);

    fs.chmod(this.executablePath, 0o755, (err) => {
      if (err) {
        throw err;
      }
    });
  }

  // TODO: support GPT4All community models
  private async downloadModel() {
    debugging("Downloading GPT4All model");
    const modelUrl = `https://the-eye.eu/public/AI/models/nomic-ai/gpt4all/${this.model}.bin`;

    return downloadFile(modelUrl, this.modelPath);
  }

  public prompt(prompt: string): Promise<string> {
    debugging("Prompting GPT4All with:", prompt);
    if (this.bot === null) {
      throw new Error("Bot is not initialized.");
    }

    this.bot?.stdin?.write(prompt + "\n");

    return new Promise((resolve, reject) => {
      let response: string = "";
      let timeoutId: NodeJS.Timeout;

      const onStdoutData = (data: Buffer) => {
        const text = data.toString();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // TODO: handle the case where the response is longer than 4 seconds
        if (text.includes(">")) {
          debugging("Response starts with >, end of message - Resolving..."); // Debug log: Indicate that the response ends with "\\f"
          terminateAndResolve(response); // Remove the trailing "\f" delimiter
        } else {
          timeoutId = setTimeout(() => {
            debugging("Timeout reached - Resolving..."); // Debug log: Indicate that the timeout has been reached
            terminateAndResolve(response);
          }, 4000); // Set a timeout of 4000ms to wait for more data
        }
        debugging("Received text:", text); // Debug log: Show the received text
        response += text;
        debugging("Updated response:", response); // Debug log: Show the updated response
      };

      const onStdoutError = (err: Error) => {
        this.bot?.stdout?.removeListener("data", onStdoutData);
        this.bot?.stdout?.removeListener("error", onStdoutError);
        reject(err);
      };

      const terminateAndResolve = (finalResponse: string) => {
        this.bot?.stdout?.removeListener("data", onStdoutData);
        this.bot?.stdout?.removeListener("error", onStdoutError);
        // check for > at the end and remove it
        if (finalResponse.endsWith(">")) {
          finalResponse = finalResponse.slice(0, -1);
        }
        resolve(finalResponse);
      };

      this.bot?.stdout?.on("data", onStdoutData);
      this.bot?.stdout?.on("error", onStdoutError);
    });
  }
}
