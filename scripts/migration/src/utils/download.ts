import fetch from "node-fetch";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform as StreamTransform } from "node:stream";
import { progress } from "./progress.js";

export async function downloadWithProgress(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const total = Number(response.headers.get("content-length")) || 0;
  let current = 0;

  progress.updateDownloadProgress(0, total, "Starting download...");

  const fileStream = fs.createWriteStream(outputPath);

  if (!response.body) {
    throw new Error("No response body");
  }

  await pipeline(response.body, new ProgressTransform(current, total), fileStream);

  progress.resetDownload();
}

// Custom Transform stream to track progress
class ProgressTransform extends StreamTransform {
  private bytesProcessed: number;
  private totalBytes: number;

  constructor(bytesProcessed: number, totalBytes: number) {
    super();
    this.bytesProcessed = bytesProcessed;
    this.totalBytes = totalBytes;
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Buffer) => void,
  ): void {
    this.bytesProcessed += chunk.length;
    progress.updateDownloadProgress(
      this.bytesProcessed,
      this.totalBytes,
      "Downloading repository...",
    );
    callback(null, chunk);
  }
}
