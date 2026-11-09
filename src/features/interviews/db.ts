import { query } from "@/data/db"
import { InterviewInput } from "@/data/dbTypes"
import { revalidateInterviewCache } from "./dbCache"

export async function insertInterview(interview: InterviewInput) {
  const { rows } = await query<{ id: string; jobInfoId: string }>(
    `INSERT INTO "interviews" ("jobInfoId", "duration", "humeChatId", "feedback")
     VALUES ($1, $2, $3, $4)
     RETURNING "id", "jobInfoId"`,
    [
      interview.jobInfoId,
      interview.duration,
      interview.humeChatId ?? null,
      interview.feedback ?? null,
    ]
  )
  const newInterview = rows[0]

  revalidateInterviewCache(newInterview)

  return newInterview
}

export async function updateInterview(
  id: string,
  interview: Partial<Pick<InterviewInput, "duration" | "humeChatId" | "feedback">>
) {
  const columnNames: Record<keyof typeof interview, string> = {
    duration: '"duration"',
    humeChatId: '"humeChatId"',
    feedback: '"feedback"',
  }
  const entries = Object.entries(interview).filter(([, value]) => value !== undefined)
  const values = entries.map(([, value]) => value)
  const setClause = entries
    .map(([key], index) => `${columnNames[key as keyof typeof interview]} = $${index + 2}`)
    .concat('"updatedAt" = now()')
    .join(", ")
  const { rows } = await query<{ id: string; jobInfoId: string }>(
    `UPDATE "interviews" SET ${setClause} WHERE "id" = $1
     RETURNING "id", "jobInfoId"`,
    [id, ...values]
  )
  const newInterview = rows[0]

  revalidateInterviewCache(newInterview)

  return newInterview
}
