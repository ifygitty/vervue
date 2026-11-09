import { query } from "@/data/db"
import {
  JobInfo,
  Question,
  questionDifficulties,
} from "@/data/dbTypes"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { insertQuestion } from "@/features/questions/db"
import { getQuestionJobInfoTag } from "@/features/questions/dbCache"
import { canCreateQuestion } from "@/features/questions/permissions"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import { generateAiQuestion } from "@/services/ai/questions"
import {
  logQuestionError,
  QuestionSaveError,
  questionStreamError,
} from "@/services/ai/questionErrors"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { createDataStreamResponse } from "ai"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import z from "zod"

const schema = z.object({
  prompt: z.enum(questionDifficulties),
  jobInfoId: z.string().min(1),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid request", { status: 400 })
  }
  const result = schema.safeParse(body)

  if (!result.success) {
    return new Response("Error generating your question", { status: 400 })
  }

  try {
    const { prompt: difficulty, jobInfoId } = result.data
    const { userId } = await getCurrentUser()

    if (userId == null) {
      return new Response("You are not logged in", { status: 401 })
    }

    if (!(await canCreateQuestion())) {
      return new Response(PLAN_LIMIT_MESSAGE, { status: 403 })
    }

    const jobInfo = await getJobInfo(jobInfoId, userId)
    if (jobInfo == null) {
      return new Response("You do not have permission to do this", {
        status: 403,
      })
    }

    const previousQuestions = await getQuestions(jobInfoId)

    return createDataStreamResponse({
      onError: questionStreamError,
      execute: async dataStream => {
        const res = generateAiQuestion({
          previousQuestions,
          jobInfo,
          difficulty,
          onFinish: async question => {
            try {
              const { id } = await insertQuestion({
                text: question,
                jobInfoId,
                difficulty,
              })

              dataStream.writeData({ questionId: id })
            } catch (error) {
              logQuestionError("saving question failed", error)
              throw new QuestionSaveError()
            }
          },
        })
        res.mergeIntoDataStream(dataStream, { sendUsage: false })
      },
    })
  } catch (error) {
    logQuestionError("request failed before streaming", error)
    return new Response(
      "Could not start question generation. Check the server terminal and try again.",
      { status: 500 }
    )
  }
}

async function getQuestions(jobInfoId: string) {
  "use cache"
  cacheTag(getQuestionJobInfoTag(jobInfoId))

  const { rows } = await query<Question>(
    'SELECT * FROM "questions" WHERE "jobInfoId" = $1 ORDER BY "createdAt" ASC',
    [jobInfoId]
  )
  return rows
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
