import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { TransformerOptions, Transformer } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class PunctuationTransformer implements Transformer {
  private punctuationMap: Map<string, string> = new Map([
    ["，", ","], // Full-width comma to ASCII comma
    ["。", "."], // Full-width period to ASCII period
    ["：", ":"], // Full-width colon to ASCII colon
    ["；", ";"], // Full-width semicolon to ASCII semicolon
    ["！", "!"], // Full-width exclamation to ASCII exclamation
    ["？", "?"], // Full-width question mark to ASCII question mark
    ["（", "("], // Full-width parentheses to ASCII parentheses
    ["）", ")"],
    ["【", "["], // Full-width brackets to ASCII brackets
    ["】", "]"],
    ["「", '"'], // Full-width quotation marks to ASCII quotes
    ["」", '"'],
    ['"', '"'], // Smart quotes to ASCII quotes
    ['"', '"'],
    ["、", ","], // Ideographic comma to ASCII comma
    ["～", "~"], // Full-width tilde to ASCII tilde
    ["《", "<"], // Full-width angle brackets to ASCII angle brackets
    ["》", ">"],
    ["…", "..."], // Ellipsis to three periods
    ["─", "-"], // Full-width dash to ASCII hyphen
    ["・", "·"], // Katakana middle dot to ASCII middle dot
  ]);

  transform(ast: Root, options: TransformerOptions): void {
    logger.log("PunctuationTransformer", "Starting punctuation normalization");

    visit(ast, "text", (node) => {
      if (typeof node.value === "string") {
        let newValue = node.value;

        // Replace each full-width punctuation mark with its ASCII equivalent
        this.punctuationMap.forEach((ascii, fullWidth) => {
          newValue = newValue.replace(new RegExp(fullWidth, "g"), ascii);
        });

        // Only update if changes were made
        if (newValue !== node.value) {
          logger.log(
            "PunctuationTransformer",
            `Normalized punctuation in text: "${node.value}" -> "${newValue}"`,
          );
          node.value = newValue;
        }
      }
    });

    logger.log("PunctuationTransformer", "Finished punctuation normalization");
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }
}
