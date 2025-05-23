import { useState, useEffect } from 'react';
const apiURL = import.meta.env.VITE_API_URL;
import UploadProfilePic from '../modals/UploadProfilePic';
import { useModal } from '../ModalContext';
import { useAppContext } from '../AppContext';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);

    type User = {
        user_id: string;
        username: string;
        profile_picture_file: string;
        profile_picture_url: string;
    };

    const [userInfo, setUserInfo] = useState<User | null>(null);
    const { showPopup } = useAppContext();

    const loadSettings = async () => {
        const response = await fetch(`${apiURL}/user_info`, {
            method: "GET",
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            setLoading(false)
            setUserInfo(response_json.data)
        } else {
            setLoading(false)
            console.error(response_json.error)
        }
    }

    const { showModal } = useModal();

    useEffect(()=>{
        loadSettings()
    }, [])
    
    if (loading) return <p>Loading...</p>;

    return (
        <div className="w-full h-full overflow-x-hidden overflow-y-scroll p-3">
            <p className="font-bold">Profile settings</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="w-full p-4 bg-bg-header-button rounded-md flex items-center gap-3">
                <img
                className="w-13 h-13 rounded-full hover:brightness-50 cursor-pointer"
                src={userInfo?.profile_picture_url}
                title="Change profile picture"
                onClick={() => showModal(<UploadProfilePic showPopup={showPopup} loadSettings={loadSettings} />)}
                />
                <h1 className="max-w-[80%] overflow-hidden overflow-ellipsis text-3xl font-medium" >{userInfo?.username}</h1>
            </div>
        </div>
    )
}