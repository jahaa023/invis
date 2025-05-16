import { Server } from "socket.io";
import { UUID } from 'crypto';

// Sets up socket io
export default function setupSocket(io: Server) {
    const connectedUsers = new Map<string, string>();

    io.on('connection', (socket) => {
        socket.on('join_online', (userId: UUID) => {
            // Add user id to connected users
            connectedUsers.set(userId, socket.id);
        })

        socket.on("disconnect", () => {
            // Remove user from connectedUsers
            for (const [userId, id] of connectedUsers.entries()) {
                if (id === socket.id) {
                    connectedUsers.delete(userId);
                    break;
                }
            }
        });
    })
}