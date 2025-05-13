// Original code from Kaillr on GitHub: https://github.com/Kaillr

// Imports
import express, { NextFunction, Request, Response } from 'express';
import 'dotenv/config';
import db from './config/db';
import argon2 from 'argon2';
import crypto, { UUID } from 'crypto';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerValidator } from './validators/registerValidator';
import { validationResult } from 'express-validator';

// Setup for the rest of the file
const app = express();
const frontendUrl = "http://localhost:5173"

app.use(
    cors({
        credentials: true,
        origin: frontendUrl
    }),
);
app.use(express.json());
app.use(cookieParser());

// Hashes a token
function generateHashedToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Generates a token
function generateToken(lifetimeMs: number) {
    const token = crypto.randomBytes(32).toString('base64url');
    const id = crypto.randomUUID();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + lifetimeMs);
    return {
        token,
        tokenHash: hashedToken,
        id,
        issuedAt,
        expiresAt,
        expiresInMs: lifetimeMs,
    };
}

// Generates a session token with 24hrs of lifetime
function generateSessionToken() {
    const lifetimeMs = 1000 * 60 * 60 * 24; // 24 hrs
    return generateToken(lifetimeMs);
}

// Inserts a session into the database
async function createSession({ req, userId, }: { req: Request; userId: UUID; }) {
    const sessionToken = generateSessionToken();
    const sessionId = crypto.randomUUID();

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Insert session
        await client.query(
            `INSERT INTO sessions (id, user_id)
            VALUES ($1::uuid, $2::uuid)`,
            [sessionId, userId],
        );

        // Insert auth token
        await client.query(
            `INSERT INTO session_tokens (id, token_hash, user_id, session_id, issued_at, expires_at)
             VALUES ($1::uuid, $2::text, $3::uuid, $4::uuid, $5, $6)`,
            [
                sessionToken.id,
                sessionToken.tokenHash,
                userId,
                sessionId,
                sessionToken.issuedAt,
                sessionToken.expiresAt,
            ],
        );

        await client.query('COMMIT');

        return { sessionToken, sessionId };
    } catch (err) {
        // Incase of error, undo changes in database
        await client.query('ROLLBACK');
        throw err;
    } finally {
        // Release client
        client.release();
    }
}

// Function for seeing if a session token is valid
async function validateSession(sessionToken: string) {
    const hashedRequestToken = generateHashedToken(sessionToken);

    try {
        const { rows } = await db.query(
            `SELECT user_id, session_id, expires_at, issued_at
             FROM session_tokens st
             WHERE st.token_hash = $1::text
               AND st.expires_at > NOW()`,
            [hashedRequestToken],
        );

        return {
            valid: true,
            id: rows[0].session_id,
            userId: rows[0].user_id,
            token: {
                issuedAt: rows[0].issued_at,
                expiresAt: rows[0].expires_at,
            },
        };
    } catch (err) {
        throw err;
    }
}

// Endpoint for retriving user id of logged in user, and validating their session
app.all('/validate-session', async (req, res) => {
    let sessionToken = null
    if (req.method === 'GET') {
        sessionToken = req.cookies.user_session;
    } else if (req.method === 'POST') {
        sessionToken = req.body.user_session;
    } else {
        res.status(405).json({
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: 'Allowed methods: GET, POST',
            },
        });
        return;
    }

    // If session token is not found in the cookies or body
    if (!sessionToken) {
        res.status(400).json({
            error: {
                code: 'BAD_REQUEST',
                message: 'Session token is required.',
            },
        });
        return;
    }

    try {
        const session = await validateSession(sessionToken);

        if (!session) {
            res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: 'Session is invalid or expired.' 
                },
            });
            return;
        }

        res.status(200).json({
            message: 'Session is valid.',
            data: {
                valid: session.valid,
                id: session.id,
                user_id: session.userId,
                token: {
                    issued_at: session.token.issuedAt,
                    expires_at: session.token.expiresAt,
                },
            },
        });
    } catch (err) {
        throw err;
    }
});

// End point for registering an account
app.post('/register', registerValidator(), async (req: Request, res: Response) => {
    // Check for any errors in the validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            status: 400,
            error: {
                code: "VALIDATOR_ERROR",
                errors: errors.array()
            }
        });
        return
    }

    // Get validated username and password
    const {username, password } = req.body;

    // Create a user id and hash their password
    const user_id = crypto.randomUUID();
    const hashed_password = await argon2.hash(password);

    // Insert info into database
    try {
        await db.query(
            `
                INSERT INTO users (id, username, password)
                VALUES ($1::uuid, $2::text, $3::text)
            `,
            [user_id, username, hashed_password],
        );
        res.status(201).json({
            message: 'User registered successfully!',
            data: { user: { user_id, username } },
        });
    } catch (err: any) {
        // If username is taken
        if (err.code === '23505' && err.constraint === 'users_username_key') {
            res.status(409).json({
                status: 409,
                error: {
                    code: 'CONFLICT',
                    message: 'Username already taken.',
                },
            });
        } else {
            throw err;
        }
    }
});

// Endpoint for logging in
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // If username or password is empty
    if (!username || !password) {
        res.status(400).json({
            status: 400,
            error: {
                code: 'BAD_REQUEST',
                message:
                    'Username or password is empty.',
            },
        });
        return;
    }

    // Get hashed password from database
    try {
        const { rows } = await db.query(
            'SELECT id, password FROM users WHERE username = $1::text',
            [username],
        );

        // If user does not exist
        if (!rows.length) {
            res.status(401).json({
                status: 401,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Incorrect username or password.',
                },
            });
            return;
        }

        // Get row with user
        const user = rows[0];
        const hashed_password = user.password;
        
        // If hashed password does not match with inputted password
        if (!(await argon2.verify(hashed_password, password))) {
            res.status(401).json({
                status: 401,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Incorrect username or password.',
                },
            });
            return;
        }

        // Create a session token
        const { sessionToken } = await createSession({ req, userId: user.id });

        // Put token inside of a cookie
        res.cookie('user_session', sessionToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: sessionToken.expiresInMs,
        });

        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', frontendUrl);

        // Return status
        res.status(200).json({
            code: "SUCCESS",
            message: 'Logged in successfully!',
        });
    } catch (err) {
        throw err;
    }
});

// Endpoint for logging a user out an clearing their session
app.post('/logout', async (req, res) => {
    // Get token from cookie
    const sessionToken = req.cookies['user_session'];

    // If there is no token
    if (!sessionToken) {
        res.status(400).json({
            error: {
                code: "BAD_REQUEST",
                message: 'You are already logged out.'
            },
        });
        return;
    }

    // Remove cookie from browser
    res.clearCookie('user_session');

    // Get session id from token
    const session = await validateSession(sessionToken);

    // Delete session from database
    try {
        await db.query('DELETE FROM sessions WHERE id = $1::uuid', [session.id]);

        res.status(200).json({
            code: "SUCCESS",
            message: 'User logged out successfully.'
        });
    } catch (err) {
        throw err;
    }
});

// If non of the endpoints above matched
app.all(/(.*)/, (req, res) => {
    res.status(404).json({
        status: 404,
        error: {
            code: 'NOT_FOUND',
            message: 'The resource you requested is either missing or not available.'
        },
    });
});

// All errors get sent as internal server errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
        },
    });
});

// Listen for requests
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
5;
