import { use, useState, type ChangeEvent } from 'react';
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
                        <div>
                            <p>{row.username}</p>
                            <p>{row.user_id}</p>
                            <img src={row.profile_picture_url} alt="" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}