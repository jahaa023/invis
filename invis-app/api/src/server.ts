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
import { Pool, Client, PoolConfig, ClientConfig } from 'pg';
import { UUID } from 'crypto';
import path from 'path';
import { Server } from "socket.io";
import socketHandler from "./socket/index"

// Define consts and setup
dotenv.config();
const port = process.env.SERVER_PORT || 5000;
const frontendURL = process.env.FRONTEND_URL
const authURL = process.env.AUTH_URL

const { createServer } = require('node:http')
const app = express();
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: frontendURL,
        methods: ['GET', 'POST']
    }
});
const socket = new socketHandler(io)

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: frontendURL,
    credentials: true,
}));

// Set up database connection
const poolConfig : PoolConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}

const clientConfig : ClientConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    connectionTimeoutMillis: 2000,
}

const pool = new Pool(poolConfig);

// Configure multer
const storage = multer.diskStorage({
    destination: './uploads/', // folder to save uploaded files
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Route to upload profile picture
app.post('/upload_profilepic', isAuthenticated, upload.single('file'), (req: AuthRequest, res) => {
    console.log('File received:', req.file);
    res.json({ message: 'File uploaded successfully' });
});

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
    }

    // Create a client
    const client = new Client(clientConfig)
    await client.connect()

    try {
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
        }

        // Get friends user id
        const friendUid = result2.rows[0].incoming

        // Delete friend request row
        await pool.query(`DELETE FROM friend_requests WHERE id = $1::uuid`, [rowId])

        // Send websocket message to remove friend request from list
        socket.reloadFriendRequests(friendUid)
    } catch (err) {
        throw err;
    } finally {
        await client.end()
    }

    // Return response
    res.status(200).json({
        message: "Friend request cancelled."
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
