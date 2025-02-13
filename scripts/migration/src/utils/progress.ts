import logUpdate from "log-update";
import { logger } from "./logger.js";
import chalk from "chalk";

export class ProgressLogger {
  private currentTransformer: string = "";
  private currentFile: string = "";
  private totalFiles: number = 0;
  private processedFiles: number = 0;
  private startTime: number = Date.now();
  private downloadProgress: number = 0;
  private downloadTotal: number = 0;
  private downloadMessage: string = "";
  private failedFiles: string[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  updateTransformer(name: string) {
    this.currentTransformer = name;
    this.updateProgress();
  }

  updateFile(file: string) {
    this.currentFile = file;
    this.processedFiles++;
    this.updateProgress();
  }

  addFailedFile(file: string) {
    this.failedFiles.push(file);
  }

  setTotalFiles(total: number) {
    this.totalFiles = total;
    this.updateProgress();
  }

  private getElapsedTime(): string {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  }

  private updateProgress() {
    // If we're downloading, show download progress
    if (this.downloadTotal > 0) {
      const progress = Math.floor((this.downloadProgress / this.downloadTotal) * 100);
      const progressBar = this.createProgressBar(progress);

      logUpdate(`
  ${chalk.cyan("Downloading Repository:")}
  ${progressBar} ${progress}%
  
  ${chalk.cyan(this.downloadMessage)}
  Downloaded: ${chalk.cyan(Math.floor(this.downloadProgress / 1024))}KB / ${Math.floor(this.downloadTotal / 1024)}KB
  
  Detailed logs: logs/migration.log
`);
      return;
    }

    // Otherwise show migration progress
    const progress =
      this.totalFiles > 0 ? Math.floor((this.processedFiles / this.totalFiles) * 100) : 0;

    const progressBar = this.createProgressBar(progress);

    logUpdate(`
  ${chalk.cyan("Migration Progress:")}
  ${progressBar} ${progress}%

  Current Transformer: ${chalk.cyan(this.currentTransformer)}
  Current File: ${chalk.cyan(this.currentFile)}
  Files Processed: ${chalk.cyan(this.processedFiles)}/${this.totalFiles}
  Time Elapsed: ${chalk.cyan(this.getElapsedTime())}

  Detailed logs: logs/migration.log
`);
  }

  updateDownloadProgress(current: number, total: number, message: string) {
    this.downloadProgress = current;
    this.downloadTotal = total;
    this.downloadMessage = message;
    this.updateProgress();
  }

  resetDownload() {
    this.downloadProgress = 0;
    this.downloadTotal = 0;
    this.downloadMessage = "";
    this.updateProgress();
  }

  private createProgressBar(progress: number): string {
    const width = 30;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
  }

  error(message: string) {
    logUpdate(`
  ${chalk.red("Migration Failed!")} ❌

  Error: ${chalk.red(message)}
  
  Check logs/migration.log for details.
`);
    logUpdate.done();
    logger.log("Migration", `Failed with error: ${message}`);
  }

  complete() {
    const elapsed = this.getElapsedTime();
    const failedFilesSection =
      this.failedFiles.length > 0
        ? `\n  ${chalk.yellow("Failed Files:")} ${this.failedFiles.length}
  ${this.failedFiles.map((file) => chalk.yellow(`- ${file}`)).join("\n  ")}\n`
        : "";

    logUpdate(`
  ${chalk.green("Migration Complete!")} ✨
  
  Files Processed: ${chalk.cyan(this.processedFiles)}/${this.totalFiles}
  Time Taken: ${chalk.cyan(elapsed)}${failedFilesSection}
  
  Detailed logs: logs/migration.log
`);
    logUpdate.done();
    logger.log("Migration", `Completed processing ${this.processedFiles} files in ${elapsed}`);
    if (this.failedFiles.length > 0) {
      logger.log("Migration", `Failed files: ${this.failedFiles.join(", ")}`);
    }
  }
}

export const progress = new ProgressLogger();
