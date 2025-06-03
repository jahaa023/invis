// Derive a key from password and salt
export default async function deriveEncryptionKey(password: string, saltHex: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const passwordBuffer = enc.encode(password);
    const baseKey = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveKey"]);
    const salt = hexToBytes(saltHex);
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
    return key;
}

// Converts a hex string to a uint8array
function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error("Invalid hex");
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}