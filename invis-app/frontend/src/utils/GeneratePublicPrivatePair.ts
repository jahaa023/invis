// Function to create a public private key pair
export default async function generatePublicPrivatePair() {
    try {
        // Generate a keypair with crypto api
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        )

        // Export the keys as spki
        const publicKeyRaw = await crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        // Convert keys to base 64
        const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
        const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw)))

        // Return json
        return {
            publicKeyBase64: publicKey,
            privateKeyBase64: privateKey,
            privateKeySpki: privateKeyRaw,
            publicKeySpki: publicKeyRaw
        }
    } catch (err) {
        throw err
    }
}