import { query } from "@/data/db"
import { User } from "@/data/dbTypes"
import { getUserIdTag } from "@/features/users/dbCache"
import { auth } from "@clerk/nextjs/server"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function getCurrentUser({ allData = false } = {}) {
  const { userId, redirectToSignIn } = await auth()

  return {
    userId,
    redirectToSignIn,
    user: allData && userId != null ? await getUser(userId) : undefined,
  }
}

async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  const { rows } = await query<User>(
    'SELECT * FROM "users" WHERE "id" = $1 LIMIT 1',
    [id]
  )
  return rows[0] ?? null
}
