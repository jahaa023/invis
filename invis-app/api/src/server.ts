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
import { Pool } from 'pg';
import { UUID } from 'crypto';
import path from 'path';
import { error } from 'console';

// Define consts and setup
dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 5000;
const frontendURL = process.env.FRONTEND_URL
const authURL = process.env.AUTH_URL

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: frontendURL,
    credentials: true,
}));

// Set up database connection
const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

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
app.post('/friend_search', isAuthenticated, async (req, res) => {
    const searchQuery = req.body.searchQuery

    // Get users with username wildcard
    const { rows } = await pool.query(`SELECT * FROM users WHERE lower(username) LIKE CONCAT('%', $1::text, '%') LIMIT 10`, [ searchQuery ])
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
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
