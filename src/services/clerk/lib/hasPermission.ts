import { auth } from "@clerk/nextjs/server"

type Permission =
  | "unlimited_access_analysis"
  | "unlimited_interview"
  | "unlimited_question"
  | "1_interview"

export async function hasPermission(permission: Permission) {
  const { has } = await auth()
  return has({ feature: permission })
}
