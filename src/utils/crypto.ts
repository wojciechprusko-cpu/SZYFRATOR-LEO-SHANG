/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Baza Przestrzeni znakowej (standard keyboard elements + common Polish characters)
export const BASIS_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,?!@#$%^&*()_+-=[]{}|;:'\"<>/\\`~ąęćłńóśźżĄĘĆŁŃÓŚŹŻ\n\r\t";

/**
 * Seeded PRNG Generator (Mulberry32)
 * Creates a deterministic random stream based on a given string seed.
 */
export function createPRNG(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  
  return function() {
    let z = (h += 0x6D2B79F5 | 0);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a unique, collision-free 3-digit mapping [100 - 999] for each character
 * in the space basis system, seeded deterministically by parameter theta.
 */
export function generatePrngMapping(seed: string) {
  const prng = createPRNG(seed || "default_theta_parameter");
  
  // Generate all 3-digit strings between 100 and 999 (900 elements possible)
  const blocks: string[] = [];
  for (let i = 100; i <= 999; i++) {
    blocks.push(i.toString());
  }

  // Seeded Fisher-Yates shuffle
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = blocks[i];
    blocks[i] = blocks[j];
    blocks[j] = temp;
  }

  const charToCode: Record<string, string> = {};
  const codeToChar: Record<string, string> = {};

  for (let i = 0; i < BASIS_CHARS.length; i++) {
    const char = BASIS_CHARS[i];
    const code = blocks[i]; // Unique 3-digit code
    charToCode[char] = code;
    codeToChar[code] = char;
  }

  return { charToCode, codeToChar };
}

/**
 * Transformacja f(X): Szyfr podstawieniowy PRNG (Letters to Random-looking sequential digits)
 */
export function prngSubstitutionEncrypt(text: string, seed: string): string {
  const { charToCode } = generatePrngMapping(seed);
  let transformed = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (charToCode[char] !== undefined) {
      transformed += charToCode[char];
    } else {
      // Out of basis fallback: map to a generic "unknown" representation using code for '?' or similar
      const fallbackChar = charToCode['?'] || "000";
      transformed += fallbackChar;
    }
  }
  
  return transformed;
}

/**
 * Retransformacja f^-1(Y): Deszyfr podstawieniowy PRNG
 */
export function prngSubstitutionDecrypt(digitString: string, seed: string): string {
  const { codeToChar } = generatePrngMapping(seed);
  const cleanDigits = digitString.replace(/[^0-9]/g, "");
  
  if (cleanDigits.length % 3 !== 0) {
    throw new Error("Błąd kardynalności układu: Długość ciągu cyfr nie jest wielokrotnością 3.");
  }
  
  let retransformed = "";
  for (let i = 0; i < cleanDigits.length; i += 3) {
    const code = cleanDigits.substring(i, i + 3);
    const char = codeToChar[code];
    if (char !== undefined) {
      retransformed += char;
    } else {
      retransformed += "░"; // Unknown mapping indicator
    }
  }
  
  return retransformed;
}


/**
 * Key Derivation Helper for AES-256
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password || "seed_parameter_theta_default");
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * AES-256-GCM Encryption with results represented entirely as space-separated 3-digit bytes [000-255].
 * This keeps the "letters are random digits" theme!
 */
export async function aesEncrypt(text: string, password: string): Promise<string> {
  if (!text) return "";
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Kryptografia AES-256 nie jest wspierana w tym środowisku (wymaga HTTPS / bezpiecznego kontekstu).");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );
  
  const ciphertext = new Uint8Array(ciphertextBuffer);
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  
  return Array.from(combined)
    .map(val => val.toString().padStart(3, "0"))
    .join(" ");
}

/**
 * AES-256-GCM Decryption of 3-digit decimal-encoded bytes.
 */
export async function aesDecrypt(digitString: string, password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Kryptografia AES-256 nie jest wspierana w tym środowisku (wymaga HTTPS / bezpiecznego kontekstu).");
  }
  const cleanDigits = digitString.trim().split(/\s+/).filter(Boolean);
  if (cleanDigits.length < 28) { // Salt 16, IV 12, Ciphertext >= 0
    throw new Error("Sygnał wejściowy zbyt krótki (niepełny salt i wektor początkowy).");
  }
  
  const combined = new Uint8Array(
    cleanDigits.map(digit => {
      const val = parseInt(digit, 10);
      if (isNaN(val) || val < 0 || val > 255) {
        throw new Error("Wykryto element spoza dopuszczalnej dziedziny bajtów [0, 255]");
      }
      return val;
    })
  );
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  
  const key = await deriveKey(password, iv); // PBKDF2 with independent salt is best but here we reuse iv for derivation salt or vice versa to align keys
  // For standard PBKDF2 we use salt, let's derive standard:
  const keyDerived = await deriveKey(password, salt);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    keyDerived,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
