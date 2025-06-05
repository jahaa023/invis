import { useState, useEffect} from "react";
const apiURL = import.meta.env.VITE_API_URL;
import UploadProfilePic from "../modals/UploadProfilePic";
import { useModal } from "../ModalContext";
import { useAppContext } from "../AppContext";
import ToggleButton from "../components/ToggleButton";
import { AiOutlineInfoCircle } from "react-icons/ai";
import KeyLocalStorageWarning from "../modals/KeyLocalStorageWarning";
import { useKeyContext } from '../KeyContext';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);

    type User = {
        user_id: string;
        username: string;
        profile_picture_file: string;
        profile_picture_url: string;
    };

    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [localStorageChecked, setLocalStorageChecked] = useState(false)
    const { showPopup } = useAppContext();
    const { key } = useKeyContext();

    const loadSettings = async () => {
        const response = await fetch(`${apiURL}/user_info`, {
            method: "GET",
            credentials: "include",
        });

        const response_json = await response.json();

        if (response.ok) {
            setLoading(false);
            setUserInfo(response_json.data);
        } else {
            setLoading(false);
            console.error(response_json.error);
        }
    };

    const handleLocalStorageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Save key to localstorage
            if (!key) {
                window.location.href = "/login"
                return
            }

            const rawKey = await crypto.subtle.exportKey('raw', key);
            const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
            localStorage.setItem('encryptionKey', keyBase64);

            setLocalStorageChecked(true)
            showPopup("Encryption key saved.", 2000, "success")
        } else {
            // Remove key from localstorage
            localStorage.removeItem("encryptionKey")
            showPopup("Encryption key unsaved.", 2000, "success")
            setLocalStorageChecked(false)
        }
    }

    const { showModal } = useModal();

    useEffect(() => {
        loadSettings();
        if (localStorage.getItem("encryptionKey")) {
            setLocalStorageChecked(true)
        } else {
            setLocalStorageChecked(false)
        }
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="w-full h-full overflow-x-hidden overflow-y-scroll p-3">
            <p className="font-bold">Profile settings</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="w-full p-4 bg-bg-header-button rounded-md flex items-center gap-3 mb-2">
                <img
                    className="w-13 h-13 rounded-full hover:brightness-50 cursor-pointer"
                    src={userInfo?.profile_picture_url}
                    title="Change profile picture"
                    onClick={() =>
                        showModal(
                            <UploadProfilePic
                                showPopup={showPopup}
                                loadSettings={loadSettings}
                            />
                        )
                    }
                />
                <h1 className="max-w-[80%] overflow-hidden overflow-ellipsis text-3xl font-medium">
                    {userInfo?.username}
                </h1>
            </div>
            <p className="font-bold">App settings</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="flex items-center gap-1.5 mb-2">
                <p>Save encryption key to localStorage?</p>
                <button className="w-6 h-6">
                    <AiOutlineInfoCircle
                    className="w-full h-full cursor-pointer"
                    onClick={() => showModal(<KeyLocalStorageWarning />)}
                    />
                </button>
            </div>
            <ToggleButton
            onChange={(e) => {handleLocalStorageChange(e)}}
            checked={localStorageChecked}
            />
        </div>
    );
}
