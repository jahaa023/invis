import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from '../AppContext';
import { useEffect, useState} from 'react'
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
    const [dropdown, setDropdown] = useState(false);
    const { popupValue, popupActive, popupType, popupIsVisible, socket } = useAppContext();

    const popupStyles: Record<string, { bar: string; text: string }> = {
        error: {
            bar: "bg-warning-red",
            text: "text-warning-red",
        },
        success: {
            bar: "bg-positive-green",
            text: "text-positive-green",
        },
        info: {
            bar: "bg-text-light",
            text: "text-text-light",
        },
    };

    interface NavBarLink {
        to: string;
        title: string;
        notifBubble?: number;
    }

    const [navBarLinks, setNavBarLinks] = useState<NavBarLink[]>([])

    // Loads in user info
    const loadUserInfo = () => {
        fetch(`${apiURL}/user_info`, {
            method: "GET",
            credentials: "include"
        })

        .then(response => response.json())

        .then(response => {
            setUserInfo(response.data)
        })

        .catch(error => {
            console.error(error)
        })
    }

    // Updates notification bubbles
    const updateNotifBubbles = async () => {
        const response = await fetch(`${apiURL}/notifications`, {
            method: "GET",
            credentials: "include"
        })

        const response_json = await response.json()

        if (response.ok) {
            setNavBarLinks([
                {
                    to : "/chats",
                    title: "Chats"
                },
                {
                    to : "/friends_list",
                    title: "Friends List",
                },
                {
                    to : "/add_friends",
                    title : "Add friends",
                    notifBubble: response_json.data.friend_requests
                },
                {
                    to : "/settings",
                    title: "Settings"
                }
            ])
        } else {
            console.error(response_json.error.message)
        }
    }

    // Gets info about logged in user from backend and connects to websocket
    let socketConnected = false;
    useEffect(()=>{
        fetch(`${apiURL}/user_info`, {
            method: "GET",
            credentials: "include"
        })

        .then(response => response.json())

        .then(response => {
            setUserInfo(response.data)
            setLoading(false);
            if (socketConnected == false) {
                socket.emit('join_online', response.data.user_id)
                socketConnected = true;
            }
        })

        .catch(error => {
            console.error(error)
            setLoading(false);
        })

        updateNotifBubbles()
    }, [])

    // Handle socket messages
    socket.on('update_navbar', () => {
        loadUserInfo()
        updateNotifBubbles()
    })

    if (loading) return <p>Loading...</p>;

    return (
        <div className="h-screen flex flex-col">
            <header className="h-fit w-screen p-3 bg-text-black border-b-2 border-black-lighter-border flex items-center">
                <div className="sm:flex sm:items-center sm:gap-2.5 hidden">
                    {navBarLinks.map((link) => (
                        <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                                isActive
                                    ? "px-3 flex items-center py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                                    : "px-3 flex items-center py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                            }
                        >
                            {link.title}
                            {link.notifBubble && link.notifBubble > 0 &&
                                <div className="w-5 h-5 rounded-full ml-1.5 flex justify-center items-center text-center bg-red-600">
                                    <span className="m-0 text-sm text-text-light">{link.notifBubble}</span>
                                </div>
                            }
                        </NavLink>
                    ))}
                </div>
                {/* Dropdown button for smaller screens */}
                <button
                    className="sm:hidden inline w-9 h-9 cursor-pointer bg-[url(/images/dropdown-white.svg)] bg-center bg-no-repeat"
                    onClick={() => setDropdown(true)}
                ></button>
                {/* Dropdown for smaller screens */}
                {dropdown &&
                <div className="sm:hidden w-screen h-screen fixed top-0 left-0 bg-transparent backdrop-blur-md z-40">
                    <div className="z-50 w-[80%] p-2.5 h-screen bg-background-black border-r-2 border-black-lighter-border relative">
                        <div className="max-h-[calc(100%-50px)] overflow-x-hidden overflow-y-scroll flex flex-col gap-3">
                            {navBarLinks.map((link) => (
                                <>
                                    <NavLink
                                        to={link.to}
                                        onClick={() => setDropdown(false)}
                                        className={({ isActive }) =>
                                            isActive
                                                ? "px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline"
                                                : "px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline"
                                        }
                                    >
                                        {link.title}
                                    </NavLink>
                                </>
                            ))}
                        </div>
                        <div className="h-[50px] w-full absolute bottom-0 left-0 m-2.5 flex items-center">
                            <button
                                className="ml-1 mt-1 w-8 h-8 cursor-pointer bg-[url(/images/x-white.svg)] bg-center bg-no-repeat"
                                onClick={() => setDropdown(false)}
                            ></button>
                        </div>
                    </div>
                </div>
                }
                <div className="sm:flex absolute right-0 px-3 py-1.5 hidden items-center gap-2 bg-bg-header-button rounded-md mr-2 w-fit max-w-50">
                    {!userInfo && <p className="text-warning-red">Failed fetching info</p>}
                    {userInfo &&
                        <>
                            <img src={userInfo?.profile_picture_url} className="rounded-full w-6 h-6"/>
                            <p className="overflow-hidden max-w-40 text-ellipsis">{userInfo?.username}</p>
                        </>
                    }
                </div>
                {/* Profile picture for smaller screens */}
                {!userInfo && <img className="sm:hidden z-30 inline absolute right-0 mr-4 rounded-full w-9 h-9" src={`${apiURL}/uploads/defaultprofile.jpg`} />}
                {userInfo &&
                    <img className="sm:hidden z-30 inline absolute right-0 mr-4 rounded-full w-9 h-9" src={userInfo?.profile_picture_url} />
                }
            </header>
            <div className="w-screen h-full overflow-hidden flex">
                <div className="hidden lg:inline h-full p-3 w-75 border-r-2 border-black-lighter-border">
                    <div className="w-full h-full flex justify-center items-center">
                        <div className="text-center">
                            <h1 className="font-bold text-4xl opacity-50">No chats yet...</h1>
                            <p className="opacity-50">Chat with friends to start the conversation!</p>
                        </div>
                    </div>
                </div>
                <div className="h-full lg:w-[calc(100%-300px)] w-full overflow-x-scroll scroll-auto">
                    <Outlet />
                </div>
            </div>
            {popupActive && (
                <div
                    className={`
                        fixed bottom-0 right-0 p-2 rounded-xl bg-bg-header-button border-black-lighter-border border-2 m-2 
                        flex items-center gap-2 sm:max-w-96 max-w-[80%] transform transition-all duration-300 ease-in-out
                        ${popupIsVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
                    `}
                >
                    <img className="w-8 h-8" src={`/images/${popupType}.svg`} />
                    <div className={`h-8 w-[1px] opacity-50 ${popupStyles[popupType]?.bar}`} />
                    <p className={`${popupStyles[popupType]?.text} text-sm`}>{popupValue}</p>
                </div>
            )}
        </div>
    );
}
