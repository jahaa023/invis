import { Server } from "socket.io";
import { UUID } from 'crypto';

// Class for managing websocket
export default class socketHandler {
    private io: Server;
    private connectedUsers: Map<string, string>;

    // Connects to socket on init
    constructor(io: Server) {
        this.io = io
        this.connectedUsers = new Map<string, string>();

        io.on('connection', (socket) => {
            socket.on('join_online', (userId: UUID) => {
                // Add user id to connected users
                this.connectedUsers.set(userId, socket.id);
            })

            socket.on("disconnect", () => {
                // Remove user from connectedUsers
                for (const [userId, id] of this.connectedUsers.entries()) {
                    if (id === socket.id) {
                        this.connectedUsers.delete(userId);
                        break;
                    }
                }
            });
        })
    }

    // Returns true if user is online, false otherwise
    isOnline(userIdCheck : UUID): boolean {
        let online: boolean = false;
        for (const [userId, id] of this.connectedUsers.entries()) {
            if (userId === userIdCheck) {
                online = true
                break;
            }
        }

        return online
    }
    
    // Function to send friend request instantly if user is online
    sendFriendRequest(userIdIncoming : UUID): void {
        // Check if user is online
        for (const [userId, id] of this.connectedUsers.entries()) {
            if (userId === userIdIncoming) {
                this.io.to(id).emit("friend_request", {
                    placeholder: "placeholder"
                })
                break;
            }
        }
    }

    // Reloads friend request list
    reloadFriendRequests(userIdReceiver : UUID): void {
        // Check if user is online
        for (const [userId, id] of this.connectedUsers.entries()) {
            if (userId === userIdReceiver) {
                this.io.to(id).emit("friend_request_reload", {
                    placeholder: "placeholder"
                })
                break;
            }
        }
    }
}