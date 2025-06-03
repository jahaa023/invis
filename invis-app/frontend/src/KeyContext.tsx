// Context for encryption and decryption key
import { createContext, useContext, useState } from "react";

// Define type
type KeyContextType = {
    key: CryptoKey | null;
    setKey: (key: CryptoKey) => void;
};

// Create a context
const KeyContext = createContext<KeyContextType | undefined>(undefined);

// Sends the key state to all pages
export const KeyProvider = ({ children }: { children: React.ReactNode }) => {
    const [key, setKey] = useState<CryptoKey | null>(null);
    return (
        <KeyContext.Provider value={{ key, setKey }}>
            {children}
        </KeyContext.Provider>
    );
};

export const useKeyContext = () => {
    const ctx = useContext(KeyContext);
    if (!ctx) throw new Error("useKeyContext must be used inside KeyProvider");
    return ctx;
};
