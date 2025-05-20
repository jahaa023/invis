import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
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
    const { socket } = useAppContext();

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
                    return <div>
                        <p>{row.username}</p>
                    </div>
                })}
                </>
                : <p>No online friends.</p>
                }
            </div>
            <p className="font-bold">Offline friends</p>
            <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
            <div className="mb-6">
                {offlineFriends.length > 0
                ?
                <>
                {offlineFriends.map((row: friendListRow) => {
                    return <div>
                        <p>{row.username}</p>
                    </div>
                })}
                </>
                : <p>No offline friends.</p>
                }
            </div>
        </div>
    )
}