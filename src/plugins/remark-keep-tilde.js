const PHRASE_CONSTRUCT = "phrasing";

function remarkKeepTilde() {
  const data = this.data();
  if (!data.toMarkdownExtensions) {
    data.toMarkdownExtensions = [];
  }
  const extensions = data.toMarkdownExtensions;

  for (const extension of extensions) {
    pruneUnsafe(extension);
  }
}

export default remarkKeepTilde;
export { remarkKeepTilde };

function pruneUnsafe(target) {
  if (!target) {
    return;
  }

  if (Array.isArray(target)) {
    for (const item of target) {
      pruneUnsafe(item);
    }
    return;
  }

  if (typeof target !== "object") {
    return;
  }

  if (Array.isArray(target.unsafe)) {
    target.unsafe = target.unsafe.filter(isNotGfmTildeRule);
  }

  if (Array.isArray(target.extensions)) {
    for (const nested of target.extensions) {
      pruneUnsafe(nested);
    }
  }
}

function isNotGfmTildeRule(rule) {
  if (!rule || rule.character !== "~") {
    return true;
  }

  const inConstruct = rule.inConstruct;

  if (typeof inConstruct === "string") {
    return inConstruct !== PHRASE_CONSTRUCT;
  }

  if (Array.isArray(inConstruct)) {
    return !inConstruct.includes(PHRASE_CONSTRUCT);
  }

  return true;
}
