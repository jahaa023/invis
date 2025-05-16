import { Server } from "socket.io";
import { UUID } from 'crypto';

// Sets up socket io
export default class socketHandler {
    private io: Server;
    private connectedUsers: Map<string, string>;

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
    
    // Function to send user id to a person
    sendFriendRequest(userId : UUID): void {
        
    }
}