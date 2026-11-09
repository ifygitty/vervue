"use server"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getJobInfoIdTag } from "../jobInfos/dbCache"
import { query } from "@/data/db"
import { Interview, JobInfo } from "@/data/dbTypes"
import { insertInterview, updateInterview as updateInterviewDb } from "./db"
import { getInterviewIdTag } from "./dbCache"
import { canCreateInterview } from "./permissions"
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/lib/errorToast"
import { env } from "@/data/env/server"
import arcjet, { tokenBucket, request } from "@arcjet/next"
import { generateAiInterviewFeedback } from "@/services/ai/interviews"

const aj = arcjet({
  characteristics: ["userId"],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: "1d",
      mode: "LIVE",
    }),
  ],
})

export async function createInterview({
  jobInfoId,
}: {
  jobInfoId: string
}): Promise<{ error: true; message: string } | { error: false; id: string }> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (!(await canCreateInterview())) {
    return {
      error: true,
      message: PLAN_LIMIT_MESSAGE,
    }
  }

  const decision = await aj.protect(await request(), {
    userId,
    requested: 1,
  })

  if (decision.isDenied()) {
    return {
      error: true,
      message: RATE_LIMIT_MESSAGE,
    }
  }

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await insertInterview({ jobInfoId, duration: "00:00:00" })

  return { error: false, id: interview.id }
}

export async function updateInterview(
  id: string,
  data: {
    humeChatId?: string
    duration?: string
  }
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await getInterview(id, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  await updateInterviewDb(id, data)

  return { error: false }
}

export async function generateInterviewFeedback(interviewId: string) {
  const { userId, user } = await getCurrentUser({ allData: true })
  if (userId == null || user == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await getInterview(interviewId, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (interview.humeChatId == null) {
    return {
      error: true,
      message: "Interview has not been completed yet",
    }
  }

  const feedback = await generateAiInterviewFeedback({
    humeChatId: interview.humeChatId,
    jobInfo: interview.jobInfo,
    userName: user.name,
  })

  if (feedback == null) {
    return {
      error: true,
      message: "Failed to generate feedback",
    }
  }

  await updateInterviewDb(interviewId, { feedback })

  return { error: false }
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

async function getInterview(id: string, userId: string) {
  "use cache"
  cacheTag(getInterviewIdTag(id))

  const { rows } = await query<
    Interview & {
      jobInfo: Pick<
        JobInfo,
        "id" | "userId" | "description" | "title" | "experienceLevel"
      >
    }
  >(
    `SELECT i.*, json_build_object(
       'id', j."id",
       'userId', j."userId",
       'description', j."description",
       'title', j."title",
       'experienceLevel', j."experienceLevel"
     ) AS "jobInfo"
     FROM "interviews" i
     INNER JOIN "job_info" j ON i."jobInfoId" = j."id"
     WHERE i."id" = $1 LIMIT 1`,
    [id]
  )
  const interview = rows[0] ?? null

  if (interview == null) return null

  cacheTag(getJobInfoIdTag(interview.jobInfo.id))
  if (interview.jobInfo.userId !== userId) return null

  return interview
}
