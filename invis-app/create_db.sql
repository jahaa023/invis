CREATE DATABASE invis;

CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_picture varchar(255) DEFAULT 'defaultprofile.jpg' NOT NULL,
    encryption_key_salt TEXT NOT NULL,
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY,
    type varchar(128) NOT NULL, -- dm, dm_temp or group
    name varchar(32),
    cover_image varchar(255) DEFAULT 'defaultgroupchat.jpg'
);

CREATE TABLE IF NOT EXISTS private_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_members (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    last_accessed int DEFAULT 0,
    joined int DEFAULT 0
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
    incoming UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groupchat_requests (
    id UUID NOT NULL PRIMARY KEY,
    outgoing UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incoming UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE
);

CREATE DATABASE invis_messages;