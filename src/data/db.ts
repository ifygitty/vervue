import { env } from "@/data/env/server"
import { attachDatabasePool } from "@vercel/functions"
import { Pool, QueryResultRow } from "pg"

if (
  !env.DATABASE_URL &&
  (!env.DB_HOST || !env.DB_PORT || !env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME)
) {
  throw new Error(
    "Set DATABASE_URL or all of DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME."
  )
}

const globalForPg = globalThis as typeof globalThis & {
  postgresPool?: Pool
}

function createPool() {
  const pool = new Pool(
    env.DATABASE_URL
      ? { connectionString: env.DATABASE_URL }
      : {
          host: env.DB_HOST,
          port: env.DB_PORT,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          database: env.DB_NAME,
        }
  )
  attachDatabasePool(pool)
  return pool
}

export const db = globalForPg.postgresPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  globalForPg.postgresPool = db
}

export async function query<T extends object>(
  text: string,
  values: unknown[] = []
) {
  return db.query<T & QueryResultRow>(text, values)
}
