// Imports
import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import { Client } from 'pg';
import { UUID } from 'crypto';
import path from 'path';
import { Server } from "socket.io";
import socketHandler from "./socket/index"
import { pool, clientConfig } from './config/db'
import { console } from 'inspector';

// Define consts and setup
dotenv.config();
const port = process.env.SERVER_PORT || 5000;
const frontendURL = process.env.FRONTEND_URL
const authURL = process.env.AUTH_URL

const { createServer } = require('node:http')
const fs = require('fs');
const app = express();
const server = createServer(app)

// Setup websocket
const io = new Server(server, {
    cors: {
        origin: frontendURL,
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: frontendURL,
    credentials: true,
}));

// Configure multer
const storage = multer.diskStorage({
    destination: './src/uploads/', // folder to save uploaded files
        filename: (req, file, cb) => {
            cb(null, String(Date.now()) + ".jpg");
    }
});
const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Function to start server as async ( for the websocket )
async function startServer() {
    const socket = await socketHandler.init(io);

    // Define new request type
    interface AuthRequest extends Request {
        userId?: UUID
    }

    // Function to return generic errors
    const returnGenError = (res: Response, code: number) => {
        // Define the error json
        let errorResponse = {
            error: {
                code: '',
                message: ''
            },
        }

        // First, go through switch for specific codes
        switch(code) {
            case 404:
                errorResponse.error.code = "NOT_FOUND"
                errorResponse.error.message = 'The resource youre looking for is either missing or not available.'
                break
            case 500:
                errorResponse.error.code = "INTERNAL_SERVER_ERROR"
                errorResponse.error.message = "Something went wrong."
                break
            default:
                // If code was not found in switch, go with a generic one
                if (code.toString().startsWith('5')) {
                    errorResponse.error.code = "INTERNAL_SERVER_ERROR"
                    errorResponse.error.message = "Something went wrong."
                } else if (code.toString().startsWith('4')) {
                    errorResponse.error.code = "CLIENT_ERROR"
                    errorResponse.error.message = "Something went wrong when processing data from client."
                } else {
                    errorResponse.error.code = "ERROR"
                    errorResponse.error.message = "Something went wrong."
                }
                break
        }

        // Return the response
        return res.status(code).json(errorResponse)
    }

    // makes sure user is authenticated and does a get request to auth server
    const isAuthenticated: RequestHandler = (req: AuthRequest, res, next) => {
        const sessionToken = req.cookies['user_session'];

        axios
            .post(`${authURL}/validate-session`, {
                user_session: sessionToken,
            })
            .then((response) => {
                const responseData = response.data.data;
                req.userId = responseData.user_id;
                next();
            })
            .catch((err) => {
                next(err);
            });
    };

    // Route to get information about user, based on session id in cookie
    app.get('/user_info', isAuthenticated, async (req: AuthRequest, res) => {
        // Query database for user info from users table
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1::uuid', [ req.userId ])

        // If no rows returned
        if (!rows.length) {
            res = returnGenError(res, 404)
            return;
        }

        // Return data
        res.status(200).json({
            message: "Data successfully fetched.",
            data: {
                user_id: rows[0].id,
                username: rows[0].username,
                profile_picture_file: rows[0].profile_picture,
                profile_picture_url: req.protocol + '://' + req.get('host') + '/uploads/' + rows[0].profile_picture
            }
        })
    })

    // Route to search for users to add friend
    app.post('/friend_search', isAuthenticated, async (req: AuthRequest, res) => {
        const searchQuery = req.body.searchQuery

        // Get users with username wildcard, that are not yourself, that are not your friend,
        // that you have not sent a request to and that havent sent a request to you. Limit to 10 rows
        const { rows } = await pool.query(`
        SELECT * FROM users u
        WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', $1::text, '%'))
            AND u.id <> $2::uuid
            AND NOT EXISTS (
                SELECT 1 FROM friends_list f
                WHERE (f.user_id_1 = $2::uuid AND f.user_id_2 = u.id)
                OR (f.user_id_2 = $2::uuid AND f.user_id_1 = u.id)
            )
            AND NOT EXISTS (
                SELECT 1 FROM friend_requests fr
                WHERE (fr.outgoing = $2::uuid AND fr.incoming = u.id)
                OR (fr.incoming = $2::uuid AND fr.outgoing = u.id)
            )
        LIMIT 10;
        `, [searchQuery, req.userId]);

        if (!rows.length) {
            res.status(200).json({
                found: 0,
                message: `No users found with a username containing '${searchQuery}'.`
            })
            return
        }

        type searchResult = {
            user_id: string;
            username: string;
            profile_picture_url: string;
        };

        let resultArray : searchResult[] = [];
        rows.forEach(row => {
            resultArray.push({
                user_id : row.id,
                username : row.username,
                profile_picture_url : req.protocol + '://' + req.get('host') + '/uploads/' + row.profile_picture
            })
        });

        res.status(200).json({
            found: 1,
            data: resultArray
        })
    })

    // Gets a users incoming and outgoing friend requests
    app.get('/friend_requests', isAuthenticated, async (req: AuthRequest, res) => {
        type friendRequest = {
            userId: string;
            username: string;
            profile_picture_url: string;
            rowId: string;
        }

        const incomingRequests: friendRequest[] = []
        const outgoingRequests: friendRequest[] = []

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            // Get incoming requests
            const result = await client.query(`
                SELECT
                    users.id AS user_id,
                    users.username,
                    users.profile_picture,
                    friend_requests.id AS row_id
                FROM friend_requests
                JOIN users ON friend_requests.outgoing = users.id
                WHERE friend_requests.incoming = $1::uuid;`,
            [req.userId])

            result.rows.forEach((row) => {
                incomingRequests.push({
                    userId: row.user_id,
                    username: row.username,
                    profile_picture_url: req.protocol + '://' + req.get('host') + '/uploads/' + row.profile_picture,
                    rowId: row.row_id
                })
            })

            // Get outgoing requests
            const result2 = await client.query(`
                SELECT
                    users.id AS user_id,
                    users.username,
                    users.profile_picture,
                    friend_requests.id AS row_id
                FROM friend_requests
                JOIN users ON friend_requests.incoming = users.id
                WHERE friend_requests.outgoing = $1::uuid;`,
            [req.userId])

            result2.rows.forEach((row) => {
                outgoingRequests.push({
                    userId: row.user_id,
                    username: row.username,
                    profile_picture_url: req.protocol + '://' + req.get('host') + '/uploads/' + row.profile_picture,
                    rowId: row.row_id
                })
            })
        } catch (err) {
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(200).json({
            outgoing: outgoingRequests,
            incoming: incomingRequests
        })
    })

    // Sends a friend request to someone
    app.post('/send_friend_request', isAuthenticated, async (req: AuthRequest, res) => {
        const friendRequestUid = req.body.userId;

        // If user id is missing
        if (!friendRequestUid) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing the following fields: userId"
                }
            })
            return;
        }

        // If user is yourself
        if (friendRequestUid === req.userId) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "This user is yourself."
                }
            })
            return;
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            // If user is already in friends list
            const result = await client.query(`
                SELECT * FROM friends_list
                WHERE user_id_1 = $1::uuid AND user_id_2 = $2::uuid;`,
            [req.userId, friendRequestUid])
            if (result.rows.length > 0) {
                res.status(400).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "This user is already in your friends list."
                    }
                })
                return;
            }

            // If user has already sent a request or has a request from this person
            const result2 = await client.query(`
                SELECT * FROM friend_requests
                WHERE outgoing = $1::uuid AND incoming = $2::uuid
                OR outgoing = $2::uuid AND incoming = $1::uuid;`,
            [req.userId, friendRequestUid])
            if (result2.rows.length > 0) {
                res.status(400).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "You have already sent a request to this user, or the user has sent you a request."
                    }
                })
                return;
            }

        } catch (err) {
            throw err;
        } finally {
            await client.end()
        }

        // Insert friend request in database
        const rowId = crypto.randomUUID()
        await pool.query(`INSERT INTO friend_requests (id, outgoing, incoming) VALUES ($1::uuid, $2::uuid, $3::uuid)`, [rowId, req.userId, friendRequestUid])

        // Send friend request in websocket as well
        socket.sendFriendRequest(friendRequestUid)
        socket.updateNavBar(friendRequestUid)

        // Return response
        res.status(201).json({
            message: "Friend request sent!"
        })
    })

    // Cancels a friend request
    app.post('/cancel_friend_request', isAuthenticated, async (req: AuthRequest, res) => {
        const rowId = req.body.rowId

        // If body doesnt have row id
        if (!rowId) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing the following fields: rowId"
                }
            })

            return
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            await client.query('BEGIN');
            // Check if friend request exists
            const result = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid;`, 
            [rowId])
            if (result.rowCount === 0) {
                res = returnGenError(res, 404)
                return
            }

            // Check if friend requests is yours
            const result2 = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid
                AND outgoing = $2::uuid;`, 
            [rowId, req.userId])
            if (result2.rowCount === 0) {
                res.status(403).json({
                    error: {
                        code: "FORBIDDEN",
                        message: "Friend request is not yours."
                    }
                })

                return
            }

            // Get friends user id
            const friendUid = result2.rows[0].incoming

            // Delete friend request row
            await client.query(`DELETE FROM friend_requests WHERE id = $1::uuid`, [rowId])
            await client.query('COMMIT');

            // Send websocket message to remove friend request from list and remove bubble from navbar
            socket.reloadFriendRequests(friendUid)
            socket.updateNavBar(friendUid)
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(200).json({
            message: "Friend request cancelled."
        })
    })

    // Declines a friend request
    app.post('/decline_friend_request', isAuthenticated, async (req: AuthRequest, res) => {
        const rowId = req.body.rowId

        // If body doesnt have row id
        if (!rowId) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing the following fields: rowId"
                }
            })

            return
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            await client.query('BEGIN');
            // Check if friend request exists
            const result = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid;`, 
            [rowId])
            if (result.rowCount === 0) {
                res = returnGenError(res, 404)
                return
            }

            // Check if friend requests is yours
            const result2 = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid
                AND incoming = $2::uuid;`, 
            [rowId, req.userId])
            if (result2.rowCount === 0) {
                res.status(403).json({
                    error: {
                        code: "FORBIDDEN",
                        message: "Friend request is not yours."
                    }
                })

                return
            }

            // Get friends user id
            const friendUid = result2.rows[0].outgoing

            // Delete friend request row
            await client.query(`DELETE FROM friend_requests WHERE id = $1::uuid`, [rowId])
            await client.query('COMMIT');

            // Send websocket message to remove friend request from list
            socket.reloadFriendRequests(friendUid)
            if (req.userId) {
                socket.updateNavBar(req.userId)
            }
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(200).json({
            message: "Friend request declined."
        })
    })

    // Accepts a friend request
    app.post('/accept_friend_request', isAuthenticated, async (req: AuthRequest, res) => {
        const rowId = req.body.rowId

        // If body doesnt have row id
        if (!rowId) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing the following fields: rowId"
                }
            })

            return
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            await client.query('BEGIN')
            // Check if friend request exists
            const result = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid;`, 
            [rowId])
            if (result.rowCount === 0) {
                res = returnGenError(res, 404)
                return
            }

            // Check if friend requests is yours
            const result2 = await client.query(`
                SELECT * FROM friend_requests
                WHERE id = $1::uuid
                AND incoming = $2::uuid;`, 
            [rowId, req.userId])
            if (result2.rowCount === 0) {
                res.status(403).json({
                    error: {
                        code: "FORBIDDEN",
                        message: "Friend request is not yours."
                    }
                })

                return
            }

            // Get friends user id
            const friendUid = result2.rows[0].outgoing

            // Delete friend request row
            await client.query(`DELETE FROM friend_requests WHERE id = $1::uuid`, [rowId])

            // Insert friend list rows
            const friendRowIds = [crypto.randomUUID(), crypto.randomUUID()]
            await client.query(`INSERT INTO friends_list (id, user_id_1, user_id_2) VALUES ($1::uuid, $2::uuid, $3::uuid)`, [friendRowIds[0], req.userId, friendUid])
            await client.query(`INSERT INTO friends_list (id, user_id_1, user_id_2) VALUES ($1::uuid, $2::uuid, $3::uuid)`, [friendRowIds[1], friendUid, req.userId])
            await client.query('COMMIT')

            // Send websocket message to reload friend request list
            socket.reloadFriendRequests(friendUid)
            if (req.userId) {
                socket.updateNavBar(req.userId)
            }
        } catch (err) {
            await client.query('ROLLBACK')
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(201).json({
            message: "Friend request accepted."
        })
    })

    // Gets a list of friends
    app.get('/friends_list', isAuthenticated, async (req: AuthRequest, res) => {
        type friendListRow = {
            userId: UUID;
            username: string;
            profile_picture_url: string;
            rowId: UUID;
        }

        const onlineFriends: friendListRow[] = []
        const offlineFriends: friendListRow[] = []

        // Get friends from database
        const { rows } = await pool.query(`
            SELECT
                users.id AS user_id,
                users.username,
                users.profile_picture,
                friends_list.id AS row_id
            FROM friends_list
            JOIN users ON friends_list.user_id_2 = users.id
            WHERE friends_list.user_id_1 = $1::uuid;`, 
        [req.userId])

        // Loop through rows and check if user is online
        rows.forEach((row) => {
            const arrayObject: friendListRow = {
                userId: row.user_id,
                username: row.username,
                profile_picture_url: req.protocol + '://' + req.get('host') + '/uploads/' + row.profile_picture,
                rowId: row.row_id
            }

            if (socket.isOnline(row.user_id)) {
                onlineFriends.push(arrayObject)
            } else {
                offlineFriends.push(arrayObject)
            }
        })

        // Return response
        res.status(200).json({
            online: onlineFriends,
            offline: offlineFriends
        })
    })

    // Removes a friend from list
    app.post('/remove_friend', isAuthenticated, async (req: AuthRequest, res) => {
        const rowId = req.body.rowId

        // If body doesnt have row id
        if (!rowId) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing the following fields: rowId"
                }
            })

            return
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        try {
            await client.query('BEGIN')

            // Check if friend list row includes user
            const result = await client.query(`
                SELECT * FROM friends_list
                WHERE user_id_1 = $1::uuid
                AND id = $2::uuid;`, 
            [req.userId, rowId])
            if (result.rowCount === 0) {
                res.status(403).json({
                    error: {
                        code: "FORBIDDEN",
                        message: "You are not friends with this user."
                    }
                })

                return
            }

            // Get friends user id
            const friendUid = result.rows[0].user_id_2

            // Delete friend list rows
            await client.query(`DELETE FROM friends_list WHERE user_id_1 = $1::uuid AND user_id_2 = $2::uuid;`, [req.userId, friendUid])
            await client.query(`DELETE FROM friends_list WHERE user_id_1 = $1::uuid AND user_id_2 = $2::uuid;`, [friendUid, req.userId])
            await client.query('COMMIT')

            // Send websocket message to reload friend list
            socket.reloadFriendsList(friendUid)
        } catch (err) {
            await client.query('ROLLBACK')
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(200).json({
            message: "Friend removed."
        })
    })

    // Endpoint for uploading cropped profile picture
    app.post('/upload_profile_pic', upload.single('file'), isAuthenticated, async (req: AuthRequest, res) => {
        // If there is no file in the request
        if (!req.file) {
            res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "The request is missing a file."
                }
            })
            return
        }

        // Create a client
        const client = new Client(clientConfig)
        await client.connect()

        // Insert file name into database
        try {
            await client.query('BEGIN')

            // Get users current profile picture
            const result = await client.query(`SELECT profile_picture FROM users WHERE id = $1::uuid;`, [ req.userId ])
            if (result.rows[0].profile_picture != "defaultprofile.jpg") {
                // Delete previous profile picture if it isnt the default
                const filePath = `./src/uploads/${result.rows[0].profile_picture}`;
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err : any) => {
                        if (err) {
                            console.error(err);
                            res = returnGenError(res, 500)
                            return
                        }
                    });
                }
            }

            // Insert new profile pic name into database
            await client.query(`UPDATE users SET profile_picture = $1::text WHERE id = $2::uuid;`, [req.file.filename, req.userId])
            await client.query('COMMIT')

            // Tell user to update navbar
            if (req.userId) {
                socket.updateNavBar(req.userId)
            }
        } catch (err) {
            await client.query('ROLLBACK')
            throw err;
        } finally {
            await client.end()
        }

        // Return response
        res.status(201).json({
            message: "Profile picture updated."
        })
    })

    // Get numbers of notifications for pending friends (and chats later on)
    app.get('/notifications', isAuthenticated, async (req: AuthRequest, res) => {
        // Get count of rows
        const { rows } = await pool.query(`
            SELECT COUNT(incoming) AS count
            FROM friend_requests
            WHERE incoming = $1::uuid;`, 
        [req.userId])

        // Return response
        res.status(200).json({
            message: "Notifications fetched successfully.",
            data: {
                friend_requests: rows[0].count
            }
        })
    })

    // If non of the endpoints above matched
    app.all(/(.*)/, (req, res) => {
        res = returnGenError(res, 404)
        return
    });

    // All errors get sent as internal server errors
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res = returnGenError(res, 500)
        return
    });


    // Listen on port
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer();