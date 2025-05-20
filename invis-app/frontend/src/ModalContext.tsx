// Renders a components inside of a div thats on top of everything else
import { createContext, useContext, useState, type ReactNode } from 'react';

type ModalContextType = {
    showModal: (content: ReactNode) => void;
    hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
const [modalContent, setModalContent] = useState<ReactNode>(null);

const showModal = (content: ReactNode) => {
    setModalContent(content);
};

const hideModal = () => {
    setModalContent(null);
};

return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
        {children}
        {modalContent && (
            <div
            style={{
                zIndex: 9999
            }}
            className='fixed top-0 left-0 right-0 bottom-0 bg-modal-bg flex items-center justify-center'
            onClick={hideModal}
            >
            <div onClick={(e) => e.stopPropagation()}>{modalContent}</div>
            </div>
        )}
    </ModalContext.Provider>
    );
};
