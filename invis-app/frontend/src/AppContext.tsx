// Global functions and values are stored here
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
    popupValue: string;
    popupActive: boolean;
    showPopup: (message: string, timeout : number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // Everything needed for a universal popup
    const [popupValue, setPopupValue] = useState("");
    const [popupActive, setPopupActive] = useState(false);
    const showPopup = (message: string, timeout: number = 2000) => {
        setPopupActive(true)
        setPopupValue(message);
        setTimeout(() => {
            setPopupActive(false)
        }, timeout)
    }

    return (
        <AppContext.Provider value={{popupValue, popupActive, showPopup}}>
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
