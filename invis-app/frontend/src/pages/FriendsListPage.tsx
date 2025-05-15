export default function FriendsListPage() {
    return(
        <div className="w-full h-full flex">
            <div className="w-[60%] h-full max-h-full overflow-x-hidden overflow-y-scroll p-3">
                <p className="font-medium">Online friends</p>
                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                <div className="mb-6">
                    Hello
                </div>
                <p className="font-medium">Offline friends</p>
                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                <div className="mb-6">
                    Hello
                </div>
                <p className="font-medium">Add friends</p>
                <div className="w-full h-[1px] bg-black-lighter-border my-2"></div>
                <div className="mb-6">
                    Hello
                </div>
            </div>
            <div className="w-[40%] h-full max-h-full overflow-x-hidden overflow-y-scroll border-l-2 border-black-lighter-border p-3">
                <div className="w-full h-full flex justify-center items-center">
                        <div className="text-center">
                            <h1 className="font-bold text-4xl opacity-50">No invites yet...</h1>
                            <p className="opacity-50">Tell your friend to send a friend request!</p>
                        </div>
                    </div>
            </div>
        </div>
    )
}