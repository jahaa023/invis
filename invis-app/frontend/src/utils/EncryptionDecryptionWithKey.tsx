// Functions for encryption and decryption with encryption key
export async function encryptWithKey(content: string, key: CryptoKey): Promise<string>  {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined)); // base64 string
}

export async function decryptWithKey(content: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(content), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12); // First 12 bytes = IV
    const ciphertext = combined.slice(12); // Rest is actual encrypted data

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}