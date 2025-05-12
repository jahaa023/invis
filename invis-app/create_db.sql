CREATE DATABASE invis;

CREATE TABLE users (
    id UUID NOT NULL PRIMARY KEY,
    username varchar(20) NOT NULL,
    password varchar(255) NOT NULL,
    profile_picture varchar(255) DEFAULT 'defaultprofile.jpg' NOT NULL,
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE sessions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL
)

CREATE TABLE session_tokens (
    id UUID NOT NULL PRIMARY KEY,
    token_hash varchar(255) NOT NULL,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    issued_at int NOT NULL,
    expires_at int NOT NULL
)

CREATE TABLE public_keys (
    id UUID NOT NULL PRIMARY KEY,
    key TEXT NOT NULL,
    user_id UUID NOT NULL,
    chat_id UUID NOT NULL
);

CREATE TABLE chats (
    id UUID NOT NULL PRIMARY KEY,
    table_name UUID NOT NULL,
    chat_name varchar(255) DEFAULT "New Chat"
);

CREATE TABLE chat_members (
    id UUID NOT NULL PRIMARY KEY,
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL
);

CREATE TABLE message_embed (
    id UUID NOT NULL PRIMARY KEY,
    chat_id UUID NOT NULL,
    message_id UUID NOT NULL,
    embed TEXT NOT NULL,
)