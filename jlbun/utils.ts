export function safeCString(s: string): Buffer {
  return Buffer.from(s + "\x00");
}
