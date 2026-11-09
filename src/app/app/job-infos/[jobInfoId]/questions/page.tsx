import { query } from "@/data/db"
import { JobInfo } from "@/data/dbTypes"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { canCreateQuestion } from "@/features/questions/permissions"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { Loader2Icon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { NewQuestionClientPage } from "./_NewQuestionClientPage"

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>
}) {
  const { jobInfoId } = await params

  return (
    <Suspense
      fallback={
        <div className="h-screen-header flex items-center justify-center">
          <Loader2Icon className="animate-spin size-24" />
        </div>
      }
    >
      <SuspendedComponent jobInfoId={jobInfoId} />
    </Suspense>
  )
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  if (!(await canCreateQuestion())) return redirect("/app/upgrade")

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) return notFound()

  return <NewQuestionClientPage jobInfo={jobInfo} />
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
