// Global functions and values are stored here
import React, { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
const apiURL = import.meta.env.VITE_API_URL;
import { io } from 'socket.io-client'

interface AppContextType {
    popupValue: string;
    popupActive: boolean;
    showPopup: (message: string, timeout? : number, type?: string) => void;
    popupType: string;
    popupIsVisible: boolean;
    socket: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // Everything needed for a universal popup
    const [popupValue, setPopupValue] = useState("");
    const [popupActive, setPopupActive] = useState(false);
    const [popupType, setPopupType] = useState("");
    const [popupIsVisible, setPopupIsVisible] = useState(false);
    const socket = io(apiURL);

    // Use ref to track the timeout ID
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showPopup = (message: string, timeout: number = 2000, type: string = "info") => {
        // Clear previous timeout if it exists
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setPopupActive(true)
        setPopupValue(message);
        setPopupType(type)
        setPopupIsVisible(true);

        // Set new timeout and store its ID
        timeoutRef.current = setTimeout(() => {
            setPopupIsVisible(false);

            setTimeout(() => {
                setPopupActive(false);
                timeoutRef.current = null; // Clear ref after use
            }, 300);
        }, timeout);
    }

    return (
        <AppContext.Provider value={{popupValue, popupActive, showPopup, popupType, popupIsVisible, socket}}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
