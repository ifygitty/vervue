import { query } from "@/data/db"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { hasPermission } from "@/services/clerk/lib/hasPermission"

export async function canCreateInterview() {
  if (await hasPermission("unlimited_interview")) return true
  if (!(await hasPermission("1_interview"))) return false
  return (await getUserInterviewCount()) < 1
}

async function getUserInterviewCount() {
  const { userId } = await getCurrentUser()
  if (userId == null) return 0

  return getInterviewCount(userId)
}

async function getInterviewCount(userId: string) {
  const { rows } = await query<{ count: string }>(
    `SELECT count(*) FROM "interviews" i
     INNER JOIN "job_info" j ON i."jobInfoId" = j."id"
     WHERE j."userId" = $1 AND i."humeChatId" IS NOT NULL`,
    [userId]
  )
  return Number(rows[0].count)
}
