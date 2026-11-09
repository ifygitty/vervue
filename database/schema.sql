CREATE TYPE "job_infos_experience_level" AS ENUM ('junior', 'mid-level', 'senior');
CREATE TYPE "questions_question_difficulty" AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE "users" (
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "email" varchar NOT NULL UNIQUE,
  "imageUrl" varchar NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "job_info" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "title" varchar,
  "name" varchar NOT NULL,
  "experienceLevel" "job_infos_experience_level" NOT NULL,
  "description" varchar NOT NULL,
  "userId" varchar NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "interviews" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "jobInfoId" uuid NOT NULL REFERENCES "job_info" ("id") ON DELETE CASCADE,
  "duration" varchar NOT NULL,
  "humeChatId" varchar,
  "feedback" varchar,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "questions" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "jobInfoId" uuid NOT NULL REFERENCES "job_info" ("id") ON DELETE CASCADE,
  "text" varchar NOT NULL,
  "difficulty" "questions_question_difficulty" NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
