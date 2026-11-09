"use server"

import z from "zod"
import { jobInfoSchema } from "./schemas"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { insertJobInfo, updateJobInfo as updateJobInfoDb } from "./db"
import { redirect } from "next/navigation"
import { query } from "@/data/db"
import { JobInfo } from "@/data/dbTypes"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getJobInfoIdTag } from "./dbCache"

export async function createJobInfo(unsafeData: z.infer<typeof jobInfoSchema>) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData)
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    }
  }

  const jobInfo = await insertJobInfo({ ...data, userId })

  redirect(`/app/job-infos/${jobInfo.id}`)
}

export async function updateJobInfo(
  id: string,
  unsafeData: z.infer<typeof jobInfoSchema>
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData)
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    }
  }

  const existingJobInfo = await getJobInfo(id, userId)
  if (existingJobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const jobInfo = await updateJobInfoDb(id, data)

  redirect(`/app/job-infos/${jobInfo.id}`)
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  const { rows } = await query<JobInfo>(
    'SELECT * FROM "job_info" WHERE "id" = $1 AND "userId" = $2 LIMIT 1',
    [id, userId]
  )
  return rows[0] ?? null
}
