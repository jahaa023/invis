import { Server } from "socket.io";
import { UUID } from "crypto";
import { pool }  from '../config/db'

export default class socketHandler {
    private io: Server;
    private connectedUsers: Map<UUID, string>;

    private constructor(io: Server) {
        this.io = io;
        this.connectedUsers = new Map<UUID, string>();

        io.on("connection", (socket) => {
            socket.on("join_online", async (userId: UUID) => {
                this.connectedUsers.set(userId, socket.id);

                // Notify friends that this user is online
                const friends = await this.getFriends(userId);
                friends.forEach((friendId) => {
                    const friendSocketId = this.connectedUsers.get(friendId);
                    if (friendSocketId) {
                        this.io.to(friendSocketId).emit("friend_status_update", {
                            friendId: userId,
                            status: "online",
                        });
                    }
                });
            });

            socket.on("disconnect", async () => {
                let disconnectedUserId: UUID | null = null;

                for (const [userId, id] of this.connectedUsers.entries()) {
                    if (id === socket.id) {
                        disconnectedUserId = userId;
                        this.connectedUsers.delete(userId);
                        break;
                    }
                }

                if (disconnectedUserId) {
                    // Notify friends that this user went offline
                    const friends = await this.getFriends(disconnectedUserId);
                    friends.forEach((friendId) => {
                        const friendSocketId = this.connectedUsers.get(friendId);
                        if (friendSocketId) {
                            this.io.to(friendSocketId).emit("friend_status_update", {
                                friendId: disconnectedUserId,
                                status: "offline",
                            });
                        }
                    });
                }
            });
        });
    }

    static async init(io: Server): Promise<socketHandler> {
        return new socketHandler(io);
    }

    // Gets a list of users friends
    private async getFriends(userId: UUID): Promise<UUID[]> {
        const friendsList: UUID[] = []
        const { rows } = await pool.query(`SELECT user_id_2 FROM friends_list WHERE user_id_1 = $1::uuid;`, [userId])
        rows.forEach((row) => {
            friendsList.push(row.user_id_2)
        })
        return friendsList;
    }

    // Checks if a user is online
    isOnline(userIdCheck: UUID): boolean {
        return this.connectedUsers.has(userIdCheck);
    }

    // Updates friend request list to receiver of request
    sendFriendRequest(userIdIncoming: UUID): void {
        const socketId = this.connectedUsers.get(userIdIncoming);
        if (socketId) {
            this.io.to(socketId).emit("friend_request", {
                placeholder: "placeholder",
            });
        }
    }

    // Updates friend request list
    reloadFriendRequests(userIdReceiver: UUID): void {
        const socketId = this.connectedUsers.get(userIdReceiver);
        if (socketId) {
            this.io.to(socketId).emit("friend_request_reload", {
                placeholder: "placeholder",
            });
        }
    }

    // Updates friend list
    reloadFriendsList(userIdReceiver: UUID): void {
        const socketId = this.connectedUsers.get(userIdReceiver);
        if (socketId) {
            this.io.to(socketId).emit("friends_list_reload", {
                placeholder: "placeholder",
            });
        }
    }

    // Tells a client to update everything in the navbar, like notif bubbles and profile picture
    updateNavBar(userIdReceiver: UUID): void {
        const socketId = this.connectedUsers.get(userIdReceiver);
        if (socketId) {
            this.io.to(socketId).emit("update_navbar", {
                placeholder: "placeholder",
            });
        }
    }
}
