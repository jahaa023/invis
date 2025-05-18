import { useState, useEffect, type ChangeEvent } from 'react';
import { useAppContext } from '../AppContext';
const apiURL = import.meta.env.VITE_API_URL;

export default function AddFriendsPage() {
    type searchUser = {
        user_id: string;
        username: string;
        profile_picture_url: string;
    };

    type friendRequest = {
        userId: string;
        username: string;
        profile_picture_url: string;
        rowId: string;
    }

    const [searchError, setSearchError] = useState(false)
    const [searchNotFound, setSearchNotFound] = useState("")
    const [searchResult, setSearchResult] = useState([])

    const [incomingRequests, setIncomingRequests] =  useState<friendRequest[]>([])
    const [outgoingRequests, setOutgoingRequests] = useState<friendRequest[]>([])

    const [loading, setLoading] = useState(true);
    const { showPopup } = useAppContext();

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const searchQuery = e.target.value;

        const response = await fetch(`${apiURL}/friend_search`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                searchQuery: searchQuery
            }),
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            setSearchError(false)
            if (response_json.found == 1) {
                setSearchNotFound("")
                setSearchResult(response_json.data)
            } else if (response_json.found == 0) {
                setSearchNotFound(response_json.message)
            }
        } else {
            setSearchError(true)
        }
    }

    // Sends a friend request to a user id
    const sendRequest = async (userId : string, e : React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const button = e.currentTarget;

        const response = await fetch(`${apiURL}/send_friend_request`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            }),
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            showPopup("Friend request sent!", 3000, "success")
            loadFriendRequests()
            button.disabled = true;
            button.style.cursor = "not-allowed"
            button.title = "You have already sent a request to this user."
        } else {
            const error = response_json.error.message;
            showPopup(error, 3000, "error")
        }
    }

    // Loads in friend requests
    const loadFriendRequests = async () => {
        const response = await fetch(`${apiURL}/friend_requests`, {
            method: "GET",
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            setLoading(false);
            setIncomingRequests(response_json.incoming)
            setOutgoingRequests(response_json.outgoing)
        } else {
            setLoading(false);
            setIncomingRequests([])
            setOutgoingRequests([])
            console.error(response_json.error)
        }
    }

    // Cancels a friend request
    const cancelFriendRequest = async (rowId: string) => {
        const response = await fetch(`${apiURL}/cancel_friend_request`, {
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
            loadFriendRequests();
            showPopup("Friend request cancelled.", 3000, "success")
        } else {
            const error = response_json.error.message
            showPopup(error, 3000, "error")
        }
    }

    useEffect(()=>{
        loadFriendRequests()
    }, [])
    
    if (loading) return <p>Loading...</p>;

    return(
        <div className='w-full h-full sm:flex inline overflow-x-hidden overflow-y-scroll'>
            <div className="sm:w-[60%] w-full sm:h-full sm:max-h-full overflow-x-hidden overflow-y-scroll p-3">
                <p className="font-bold">Add friends</p>
                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                <div className="w-full bg-bg-header-button p-3 rounded-md">
                    <input type="text" 
                    className="w-full bg-background-black py-1 px-3 rounded-full"
                    placeholder="Start searching..."
                    onChange={handleChange}
                    />
                    <div className="w-full h-72 overflow-x-hidden overflow-y-scroll p-2">
                        {searchError && <p className='text-warning-red'>Something went wrong during search.</p>}
                        {searchNotFound && <p>{searchNotFound}</p>}
                        {!searchError && !searchNotFound && searchResult && searchResult.map((row : searchUser) => (
                            <div key={row.user_id}>
                                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                                <div className='flex items-center gap-3 relative hover:bg-bg-black-lighter p-2 rounded-sm'>
                                    <img className='w-10 h-10 rounded-full border-bg-header-button border-2' src={row.profile_picture_url} alt="" />
                                    <p className='text-2xl'>{row.username}</p>
                                    <button
                                        className='w-11 h-11 rounded-full hover:bg-brand-transparent border-none cursor-pointer absolute right-0 mr-3 bg-[url(/images/add-friend-white.svg)] bg-center bg-no-repeat bg-size-[60%]'
                                        title={`Send ${row.username} a friend request.`}
                                        onClick={(e) => sendRequest(row.user_id, e)}
                                    ></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="sm:w-[40%] w-full sm:h-full sm:max-h-full overflow-x-hidden overflow-y-scroll sm:border-l-2 border-black-lighter-border p-3 flex flex-col">
                <p className="font-bold">Friend requests</p>
                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                <div className='w-full h-full'>
                    {incomingRequests.length === 0 && outgoingRequests.length === 0
                    ?   <div className="w-full h-full sm:flex justify-center items-center">
                            <div className="sm:text-center text-left">
                                <h1 className="font-bold text-4xl opacity-50">No requests yet...</h1>
                                <p className="opacity-50">Tell your friend to send a friend request!</p>
                            </div>
                        </div>
                    :   <div className='w-full bg-bg-header-button p-3 rounded-md'>
                            <div className='mb-5'>
                                <p className="font-medium opacity-50 font-stretch-expanded">INCOMING FRIEND REQUESTS</p>
                                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                                {incomingRequests.length > 0
                                ? <p>ddlk</p>
                                : <p>No incoming friend requests</p>
                                }
                            </div>
                            <div>
                                <p className="font-medium opacity-50 font-stretch-expanded">OUTGOING FRIEND REQUESTS</p>
                                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                                {outgoingRequests.length > 0
                                ?
                                <>
                                {outgoingRequests.map((row: friendRequest) => {
                                    return <div className='w-full p-2 flex items-center bg-background-black rounded-md gap-1.5 relative'>
                                        <img className='w-8 h-8 rounded-full border-black-lighter-border border-2' src={row.profile_picture_url} />
                                        <p className='font-medium'>{row.username}</p>
                                        <button
                                            className='w-9 h-9 rounded-full absolute cursor-pointer right-0 m-2 hover:bg-warning-red-transparent bg-[url(/images/x-red.svg)] bg-center bg-no-repeat bg-size-[50%]'
                                            title='Cancel friend request'
                                            onClick={() => cancelFriendRequest(row.rowId)}
                                        ></button>
                                    </div>
                                })}
                                </>
                                : <p>No outgoing friend requests</p>
                                }
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}