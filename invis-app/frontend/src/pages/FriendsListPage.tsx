import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { useModal } from '../ModalContext';
import FriendOptions from '../modals/FriendOptions'
const apiURL = import.meta.env.VITE_API_URL;

export default function FriendsListPage() {
    type friendListRow = {
        userId: string;
        username: string;
        profile_picture_url: string;
        rowId: string;
    }

    // Define states
    const [loading, setLoading] = useState(true);
    const [offlineFriends, setOfflineFriends] = useState([])
    const [onlineFriends, setOnlineFriends] = useState([])
    const { socket, showPopup } = useAppContext();

    const { showModal } = useModal();

    // Function to update friends list
    const loadFriendsList = async () => {
        const response = await fetch(`${apiURL}/friends_list`, {
            method: "GET",
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            setLoading(false);
            setOfflineFriends(response_json.offline);
            setOnlineFriends(response_json.online);
        } else {
            setOfflineFriends([])
            setOnlineFriends([])
            setLoading(false);
            console.error(response_json.error)
        }
    }

    socket.on('friend_status_update', () => {
        loadFriendsList()
    })

    socket.on('friends_list_reload', () => {
        loadFriendsList()
    })

    useEffect(()=>{
        loadFriendsList()
    }, [])
    
    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-3">
            <p className="font-bold">Online friends</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="mb-6">
                {onlineFriends.length > 0
                ?
                <>
                {onlineFriends.map((row: friendListRow) => {
                    return <div className="w-full p-2 rounded-md hover:bg-bg-header-button flex items-center gap-2 relative">
                        <img src={row.profile_picture_url} className='w-9 h-9 rounded-full border-background-black border-2' />
                        <p className='max-w-[70%] overflow-hidden overflow-ellipsis'>{row.username}</p>
                        <div className='absolute right-0 mr-3 flex items-center gap-1'>
                            <button
                                className='w-6 h-6 cursor-pointer opacity-50 hover:opacity-100 bg-[url(/images/chat-white.svg)] bg-center bg-no-repeat bg-cover'
                                title={`Send ${row.username} a message.`}
                            ></button>
                            <button
                                className='w-6 h-6 cursor-pointer opacity-50 hover:opacity-100 bg-[url(/images/dots-3-white.svg)] bg-center bg-no-repeat'
                                title="Options"
                                onClick={() => showModal(<FriendOptions username={row.username} profile_picture_url={row.profile_picture_url} rowId={row.rowId} loadFriendsList={loadFriendsList} showPopup={showPopup} />)}
                            ></button>
                        </div>
                    </div>
                })}
                </>
                : <p>No online friends.</p>
                }
            </div>
            <p className="font-bold">Offline friends</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="mb-6 flex flex-col gap-2.5">
                {offlineFriends.length > 0
                ?
                <>
                {offlineFriends.map((row: friendListRow) => {
                    return <div className="w-full p-2 rounded-md hover:bg-bg-header-button flex items-center gap-2 relative">
                        <img src={row.profile_picture_url} className='w-9 h-9 rounded-full border-background-black border-2' />
                        <p className='max-w-[70%] overflow-hidden overflow-ellipsis'>{row.username}</p>
                        <div className='absolute right-0 mr-3 flex items-center gap-1'>
                            <button
                                className='w-6 h-6 cursor-pointer opacity-50 hover:opacity-100 bg-[url(/images/chat-white.svg)] bg-center bg-no-repeat bg-cover'
                                title={`Send ${row.username} a message.`}
                            ></button>
                            <button
                                className='w-6 h-6 cursor-pointer opacity-50 hover:opacity-100 bg-[url(/images/dots-3-white.svg)] bg-center bg-no-repeat'
                                title="Options"
                                onClick={() => showModal(<FriendOptions username={row.username} profile_picture_url={row.profile_picture_url} rowId={row.rowId} loadFriendsList={loadFriendsList} showPopup={showPopup} />)}
                            ></button>
                        </div>
                    </div>
                })}
                </>
                : <p>No offline friends.</p>
                }
            </div>
        </div>
    )
}