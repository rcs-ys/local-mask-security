import { gcm } from "@noble/ciphers/aes.js";

const NONCE_LENGTH = 12;

function randomNonce(): Uint8Array {
  const nonce = new Uint8Array(NONCE_LENGTH);
  globalThis.crypto.getRandomValues(nonce);
  return nonce;
}

export function assertAes256Key(key: Uint8Array): void {
  if (key.length !== 32) {
    throw new Error("encryptionKey must be 32 bytes (AES-256)");
  }
}

export function sealUtf8(plaintext: string, key: Uint8Array): string {
  assertAes256Key(key);
  const nonce = randomNonce();
  const aes = gcm(key, nonce);
  const ciphertext = aes.encrypt(new TextEncoder().encode(plaintext));
  const packed = new Uint8Array(nonce.length + ciphertext.length);
  packed.set(nonce, 0);
  packed.set(ciphertext, nonce.length);
  return bytesToBase64(packed);
}

export function openUtf8(sealed: string, key: Uint8Array): string {
  assertAes256Key(key);
  const packed = base64ToBytes(sealed);
  if (packed.length <= NONCE_LENGTH) {
    throw new Error("Invalid sealed payload");
  }
  const nonce = packed.slice(0, NONCE_LENGTH);
  const ciphertext = packed.slice(NONCE_LENGTH);
  const aes = gcm(key, nonce);
  const plain = aes.decrypt(ciphertext);
  return new TextDecoder().decode(plain);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}
