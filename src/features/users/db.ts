import { db } from "@/data/db"
import { UserInput } from "@/data/dbTypes"
import { revalidateUserCache } from "./dbCache"

export async function createUserIfMissing(user: UserInput) {
  await db.query(
    `INSERT INTO "users" ("id", "name", "email", "imageUrl", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, COALESCE($5, now()), COALESCE($6, now()))
     ON CONFLICT ("id") DO NOTHING`,
    [
      user.id,
      user.name,
      user.email,
      user.imageUrl,
      user.createdAt ?? null,
      user.updatedAt ?? null,
    ]
  )

  revalidateUserCache(user.id)
}

export async function upsertUser(user: UserInput) {
  await db.query(
    `INSERT INTO "users" ("id", "name", "email", "imageUrl", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, COALESCE($5, now()), COALESCE($6, now()))
     ON CONFLICT ("id") DO UPDATE SET
       "name" = EXCLUDED."name",
       "email" = EXCLUDED."email",
       "imageUrl" = EXCLUDED."imageUrl",
       "createdAt" = EXCLUDED."createdAt",
       "updatedAt" = EXCLUDED."updatedAt"`,
    [
      user.id,
      user.name,
      user.email,
      user.imageUrl,
      user.createdAt ?? null,
      user.updatedAt ?? null,
    ]
  )

  revalidateUserCache(user.id)
}



export async function deleteUser(id: string) {
  await db.query('DELETE FROM "users" WHERE "id" = $1', [id])

  revalidateUserCache(id)
}
