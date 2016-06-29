DROP DATABASE IF EXISTS setlistify_development;
CREATE DATABASE setlistify_development;

\c setlistify_development;

CREATE TABLE IF NOT EXISTS users (
  "id" SERIAL PRIMARY KEY,
  "access_token" VARCHAR (255) NOT NULL,
  "spotify_user_id" VARCHAR (255),
  "created_at" timestamp NOT NULL default now(),
  "updated_at" timestamp NOT NULL default now()
);
