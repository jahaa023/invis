import { useState, type ChangeEvent } from 'react';
import { useAppContext } from '../AppContext';
const apiURL = import.meta.env.VITE_API_URL;

export default function AddFriendsPage() {
    type searchUser = {
        user_id: string;
        username: string;
        profile_picture_url: string;
    };

    const [searchError, setSearchError] = useState(false)
    const [searchNotFound, setSearchNotFound] = useState("")
    const [searchResult, setSearchResult] = useState([])
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
            showPopup("Friend request sent!", 2000)
            button.disabled = true;
            button.style.cursor = "not-allowed"
            button.title = "You have already sent a request to this user."
        } else {
            const error = response_json.error.message;
            showPopup(error, 2000)
        }
    }

    return(
        <div className="w-full h-full p-3">
            <p className="font-medium">Add friends</p>
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
    )
}