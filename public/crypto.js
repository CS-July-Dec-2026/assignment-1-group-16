// public/crypto.js
// All cryptographic operations for this app.
// This is a thin wrapper around the browser's built-in Web Crypto API.

/**
 * Takes a password string, hashes it with SHA-256,
 * returns a CryptoKey usable for AES-GCM encrypt/decrypt.
 */
async function hashPasswordToKey(password) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password); // converts string → bytes

  // SHA-256: always produces exactly 32 bytes from any input
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBytes);

  // Import those 32 bytes as an AES-256-GCM key
  return crypto.subtle.importKey(
    "raw",           // format: raw bytes
    hashBuffer,      // the 32-byte hash
    { name: "AES-GCM" },
    false,           // not exportable (security)
    ["encrypt", "decrypt"]  // what this key can do
  );
}

/**
 * Encrypts a plaintext message using AES-GCM.
 * Returns { ciphertext: "base64...", iv: "base64..." }
 */
async function encryptMessage(password, plaintext) {
  const key = await hashPasswordToKey(password);

  // Generate a fresh random 12-byte IV every single time
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Do the encryption
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    plaintextBytes
  );

  // Convert binary data to base64 strings (safe for HTML/DB storage)
  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypts ciphertext using AES-GCM.
 * Throws an error if the password is wrong (AES-GCM authentication fails).
 */
async function decryptMessage(password, ciphertextB64, ivB64) {
  const key = await hashPasswordToKey(password);

  // Convert base64 strings back to binary
  const iv = base64ToBuffer(ivB64);
  const ciphertext = base64ToBuffer(ciphertextB64);

  // Do the decryption
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer); // bytes → string
}

// ── Helper functions ──────────────────────────────────────

// Converts an ArrayBuffer to a base64 string
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Converts a base64 string back to an ArrayBuffer
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
