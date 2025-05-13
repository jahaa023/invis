import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from 'react'
const apiURL = import.meta.env.VITE_API_URL;

export default function MainLayout() {
    type User = {
        user_id: string;
        username: string;
        profile_picture_file: string;
        profile_picture_url: string;
    };

    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Gets info about logged in user from backend
    useEffect(()=>{
        fetch(`${apiURL}/user_info`, {
            method: "GET",
            credentials: "include"
        })

        .then(response => response.json())

        .then(response => {
            setUserInfo(response.data)
            setLoading(false);
        })

        .catch(error => {
            console.error(error)
            setLoading(false);
        })
    }, [])

    if (loading) return <p>Loading...</p>;

    return (
        <div className="h-screen flex flex-col">
            <header className="h-fit w-screen p-3 bg-text-black border-b-2 border-gray-500 flex items-center gap-2.5">
                <NavLink
                    to={"/chats"}
                    className={({ isActive }) =>
                        isActive
                            ? "px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                            : "px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                    }
                >
                    Chats
                </NavLink>
                <NavLink
                    to={"/friends_list"}
                    className={({ isActive }) =>
                        isActive
                            ? "px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                            : "px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                    }
                >
                    Friends list
                </NavLink>
                <NavLink
                    to={"/settings"}
                    className={({ isActive }) =>
                        isActive
                            ? "px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                            : "px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                    }
                >
                    Settings
                </NavLink>
                <NavLink
                    to={"/help_center"}
                    className={({ isActive }) =>
                        isActive
                            ? "px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                            : "px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                    }
                >
                    Help Center
                </NavLink>
                <div className="absolute right-0 px-3 py-1.5 flex items-center gap-2 bg-bg-header-button rounded-md mr-2 w-fit max-w-50">
                    {!userInfo && <p className="text-warning-red">Failed fetching info</p>}
                    {userInfo &&
                        <>
                            <img src={userInfo?.profile_picture_url} className="rounded-full w-6 h-6"/>
                            <p className="overflow-hidden max-w-40 text-ellipsis">{userInfo?.username}</p>
                        </>
                    }
                </div>
            </header>
            <div className="h-full overflow-x-scroll scroll-auto">
                <Outlet />
            </div>
        </div>
    );
}
