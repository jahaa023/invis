import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 5001;

app.use(cors());
app.use(express.json());

app.listen(port, () => {
    console.log(`Auth server running at http://localhost:${port}`);
});
