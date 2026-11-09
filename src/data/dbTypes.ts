export const experienceLevels = ["junior", "mid-level", "senior"] as const
export type ExperienceLevel = (typeof experienceLevels)[number]

export const questionDifficulties = ["easy", "medium", "hard"] as const
export type QuestionDifficulty = (typeof questionDifficulties)[number]

export type User = {
  id: string
  name: string
  email: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

export type UserInput = Pick<User, "id" | "name" | "email" | "imageUrl"> &
  Partial<Pick<User, "createdAt" | "updatedAt">>

export type JobInfo = {
  id: string
  title: string | null
  name: string
  experienceLevel: ExperienceLevel
  description: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type JobInfoInput = Pick<
  JobInfo,
  "name" | "title" | "experienceLevel" | "description" | "userId"
>

export type Question = {
  id: string
  jobInfoId: string
  text: string
  difficulty: QuestionDifficulty
  createdAt: Date
  updatedAt: Date
}

export type QuestionInput = Pick<
  Question,
  "jobInfoId" | "text" | "difficulty"
>

export type Interview = {
  id: string
  jobInfoId: string
  duration: string
  humeChatId: string | null
  feedback: string | null
  createdAt: Date
  updatedAt: Date
}

export type InterviewInput = Pick<Interview, "jobInfoId" | "duration"> &
  Partial<Pick<Interview, "humeChatId" | "feedback">>
