export function safeCString(s: string): Buffer {
  // FIXME: need to copy the buffer again to avoid memory corruption
  return Buffer.from(Buffer.from(s));
}
