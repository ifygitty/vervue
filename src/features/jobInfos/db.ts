import { query } from "@/data/db"
import { JobInfoInput } from "@/data/dbTypes"
import { revalidateJobInfoCache } from "./dbCache"

export async function insertJobInfo(jobInfo: JobInfoInput) {
  const { rows } = await query<{ id: string; userId: string }>(
    `INSERT INTO "job_info"
       ("name", "title", "experienceLevel", "description", "userId")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING "id", "userId"`,
    [
      jobInfo.name,
      jobInfo.title,
      jobInfo.experienceLevel,
      jobInfo.description,
      jobInfo.userId,
    ]
  )
  const newJobInfo = rows[0]

  revalidateJobInfoCache(newJobInfo)

  return newJobInfo
}




export async function updateJobInfo(
  id: string,
  jobInfo: Partial<Omit<JobInfoInput, "userId">>
) {
  const columnNames: Record<keyof typeof jobInfo, string> = {
    name: '"name"',
    title: '"title"',
    experienceLevel: '"experienceLevel"',
    description: '"description"',
  }
  const entries = Object.entries(jobInfo).filter(([, value]) => value !== undefined)
  const values = entries.map(([, value]) => value)
  const setClause = entries
    .map(([key], index) => `${columnNames[key as keyof typeof jobInfo]} = $${index + 2}`)
    .concat('"updatedAt" = now()')
    .join(", ")
  const { rows } = await query<{ id: string; userId: string }>(
    `UPDATE "job_info" SET ${setClause} WHERE "id" = $1
     RETURNING "id", "userId"`,
    [id, ...values]
  )
  const updatedJobInfo = rows[0]

  revalidateJobInfoCache(updatedJobInfo)

  return updatedJobInfo
}
