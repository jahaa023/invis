import { useModal } from '../ModalContext';
import { useState } from 'react';
const apiURL = import.meta.env.VITE_API_URL;

export default function FriendOptions({
        username,
        profile_picture_url,
        rowId,
        loadFriendsList,
        showPopup
        }: {
        username: string,
        profile_picture_url: string,
        rowId : string,
        loadFriendsList: () => void,
        showPopup: (message: string, timeout? : number, type?: string) => void;
    }) {
    const { hideModal} = useModal();
    const [mainActive, setMainActive] = useState(true)
    const [removeActive, setRemoveActive] = useState(false)

    const removeFriend = async (rowId: string) => {
        const response = await fetch(`${apiURL}/remove_friend`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rowId: rowId
            }),
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            hideModal()
            showPopup("Friend removed.", 3000, "success")
            loadFriendsList()
        } else {
            hideModal()
            showPopup(response_json.error.message, 3000, "error")
            console.error(response_json.error)
        }
    }

    return (
        <div className="p-4 pr-12 bg-background-black border-2 border-black-lighter-border rounded-md flex flex-col gap-4 min-w-auto md:min-w-xl max-w-[80vw] relative">
            {mainActive && 
            <>
                <div className="w-full flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full" src={profile_picture_url} />
                    <p className="font-bold max-w-[90%] overflow-hidden overflow-ellipsis">{username}</p>
                </div>
                <div>
                    <button
                    className="text-sm p-2 border-warning-red border-2 text-warning-red rounded-md cursor-pointer hover:bg-warning-red hover:text-text-light"
                    title='Remove friend'
                    onClick={() => {setMainActive(false); setRemoveActive(true)}}
                    >Remove friend</button>
                </div>
            </>
            }
            {removeActive &&
            <>
                <div className='w-full h-full text-center flex flex-col items-center gap-3'>
                    <h1>{`Are you sure you want to remove ${username} from your friends list?`}</h1>
                    <div className='flex items-center gap-3'>
                        <button
                        className='text-sm p-2 border-cancel-grey border-2 text-cancel-grey rounded-md cursor-pointer hover:bg-cancel-grey hover:text-text-light'
                        title='Cancel'
                        onClick={() => {setMainActive(true); setRemoveActive(false)}}
                        >Cancel</button>
                        <button
                        className='text-sm p-2 border-warning-red border-2 text-warning-red rounded-md cursor-pointer hover:bg-warning-red hover:text-text-light'
                        title='Confirm'
                        onClick={() => removeFriend(rowId)}
                        >Confirm</button>
                    </div>
                </div>
            </>
            }
            <button
            className="w-6 h-6 opacity-50 hover:opacity-100 absolute top-0 right-0 m-2 rounded-full hover:bg-white-transparent cursor-pointer bg-[url(/images/x-white.svg)] bg-center bg-no-repeat bg-size-[60%]"
            title="Close"
            onClick={() => hideModal()}
            ></button>
        </div>
    )
}