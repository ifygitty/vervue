import { query } from "@/data/db"
import { QuestionInput } from "@/data/dbTypes"
import { revalidateQuestionCache } from "./dbCache"

export async function insertQuestion(question: QuestionInput) {
  const { rows } = await query<{ id: string; jobInfoId: string }>(
    `INSERT INTO "questions" ("jobInfoId", "text", "difficulty")
     VALUES ($1, $2, $3)
     RETURNING "id", "jobInfoId"`,
    [question.jobInfoId, question.text, question.difficulty]
  )
  const newQuestion = rows[0]

  revalidateQuestionCache({
    id: newQuestion.id,
    jobInfoId: newQuestion.jobInfoId,
  })

  return newQuestion
}
