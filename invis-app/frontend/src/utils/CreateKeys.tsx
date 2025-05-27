import { type UUID } from "crypto"

// Creates a public private key pair for communicating with a user
type localStorageKeys = {
    my_uid: UUID;
    friend_uid: UUID;
    private_key: string
}

export const generateKeyPair = async () => {

}