import { Buffer } from 'buffer';

const nextBytesMatch = (buf, bytes, startIndex) => {
  for (let i = 1; i < bytes.length; i++) {
    if (bytes[i] !== buf[startIndex + i]) {
      return false;
    }
  }
  return true;
};

export const stringToBytes = (str: string) => Array.from(str).map(character => character.charCodeAt(0));
export const uint8ArrayUtf8ByteString = (array: any, start: number, end: number) => String.fromCharCode(...array.slice(start, end));
export const readUInt64LE = (buffer, offset = 0) => {
  let n = buffer[offset];
  let mul = 1;
  let i = 0;

  while (++i < 8) {
    mul *= 0x100;
    n += buffer[offset + i] * mul;
  }
  return n;
};
export const tarHeaderChecksumMatches = buffer => {
  // Does not check if checksum field characters are valid
  if (buffer.length < 512) {
    // `tar` header size, cannot compute checksum without it
    return false;
  }

  const MASK_8TH_BIT = 0x80;

  // Intitalize sum, with 256 as sum of 8 spaces in checksum field
  let sum = 256;
  // Initialize signed bit sum
  let signedBitSum = 0;

  for (let i = 0; i < 148; i++) {
    const byte = buffer[i];
    sum += byte;
    // Add signed bit to signed bit sum
    // tslint:disable-next-line: no-bitwise
    signedBitSum += byte & MASK_8TH_BIT;
  }

  // Skip checksum field

  for (let i = 156; i < 512; i++) {
    const byte = buffer[i];
    sum += byte;
    // Add signed bit to signed bit sum
    // tslint:disable-next-line: no-bitwise
    signedBitSum += byte & MASK_8TH_BIT;
  }

  // Read sum in header
  const readSum = parseInt(uint8ArrayUtf8ByteString(buffer, 148, 154), 8);

  // Some implementations compute checksum incorrectly using signed bytes
  return (
    // Checksum in header equals the sum we calculated
    readSum === sum ||
    // Checksum in header equals sum we calculated plus signed-to-unsigned delta
    // tslint:disable-next-line: no-bitwise
    readSum === (sum - (signedBitSum << 1))
  );
};
export const multiByteIndexOf = (buffer, bytesToSearch, startAt = 0) => {
  // `Buffer#indexOf()` can search for multiple bytes
  if (Buffer && Buffer.isBuffer(buffer)) {
    return buffer.indexOf(Buffer.from(bytesToSearch), startAt);
  }

  // `Uint8Array#indexOf()` can search for only a single byte
  let index = buffer.indexOf(bytesToSearch[0], startAt);
  while (index >= 0) {
    if (nextBytesMatch(buffer, bytesToSearch, index)) {
      return index;
    }

    index = buffer.indexOf(bytesToSearch[0], index + 1);
  }

  return -1;
};
