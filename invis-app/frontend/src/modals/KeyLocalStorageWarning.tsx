import { useModal } from "../ModalContext";

export default function KeyLocalStorageWarning() {
    const { hideModal } = useModal();

    return (
        <div className="p-4 bg-background-black border-2 border-black-lighter-border rounded-md min-w-auto md:min-w-xl md:max-w-2xl max-w-[80vw] relative">
            <p className="text-text-light">
                By default, your encryption key is stored in RAM for better security and safety. But this causes you to automatically log out whenever you refresh the page.
                You can prevent this by storing the encryption key on the browser (localStorage) but it is a security risk as it is easier to access that way and could leave
                your encryption key vulnerable to <a href="https://en.wikipedia.org/wiki/Infostealer" target="_blank">infostealers.</a>
            </p>
            <button
            onClick={() => hideModal()}
            className="text-sm p-2 border-brand border-2 text-brand rounded-md cursor-pointer hover:bg-brand hover:text-text-light mt-3"
            >Got it</button>
        </div>
    )
}