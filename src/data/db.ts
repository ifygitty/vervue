import { env } from "@/data/env/server"
import { Pool, QueryResultRow } from "pg"

const globalForPg = globalThis as typeof globalThis & {
  postgresPool?: Pool
}

export const db =
  globalForPg.postgresPool ??
  new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.postgresPool = db
}

export async function query<T extends object>(
  text: string,
  values: unknown[] = []
) {
  return db.query<T & QueryResultRow>(text, values)
}
