CREATE DATABASE invis;

CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_picture varchar(255) DEFAULT 'defaultprofile.jpg' NOT NULL,
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_tokens (
    id UUID PRIMARY KEY,
    token_hash TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS friends_list (
    id UUID NOT NULL PRIMARY KEY,
    user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID NOT NULL PRIMARY KEY,
    outgoing UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incoming UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chats (
    id UUID NOT NULL PRIMARY KEY,
    table_name UUID NOT NULL,
    chat_name varchar(255) DEFAULT "New Chat"
);

CREATE TABLE chat_members (
    id UUID NOT NULL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_accessed int NOT NULL -- Unix timestamp
);

CREATE TABLE message_embed (
    id UUID NOT NULL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL,
    embed TEXT NOT NULL,
)

CREATE TABLE public_keys (
    id UUID NOT NULL PRIMARY KEY,
    key TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE
);