// Convert base64 key into a usable one
export default async function importKey(base64Key: string, type: string) {
    function base64ToArrayBuffer(base64: string) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    const rawKey = base64ToArrayBuffer(base64Key);

    if (type == "public") {
        const key = await crypto.subtle.importKey(
            "spki",
            rawKey,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
        return key
    } else if (type == "private") {
        const key = await crypto.subtle.importKey(
            "spki",
            rawKey,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["decrypt"]
        );
        return key
    } else {
        throw Error("Invalid key type")
    }
}