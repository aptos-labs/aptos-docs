const alphabet = "abcdefghijklmnopqrstuvwxyz";

export function cssId(length = 20) {
  const randomArray = crypto.getRandomValues(new Uint8Array(length));
  let id = "";

  for (const i of randomArray) {
    id += alphabet[i % alphabet.length] ?? "";
  }

  return id;
}
