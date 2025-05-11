CREATE DATABASE invis;

CREATE TABLE users(
    id UUID NOT NULL PRIMARY KEY,
    username varchar(127) NOT NULL,
    password varchar(255) NOT NULL,
    profile_picture varchar(255) NOT NULL DEFAULT "defaultprofile.jpg"
);

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
)