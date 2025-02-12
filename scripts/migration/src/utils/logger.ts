import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../../logs");
const logFile = path.join(logsDir, "migration.log");

class Logger {
  constructor() {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Clear or create log file
    fs.writeFileSync(logFile, "", "utf8");
  }

  log(source: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(" ");

    const logMessage = `[${timestamp}] [${source}] ${message}\n`;

    // Write to file
    fs.appendFileSync(logFile, logMessage);

    // Write to both stdout and stderr
    // process.stdout.write(logMessage);
    // process.stderr.write(logMessage);
  }
}

export const logger = new Logger();
