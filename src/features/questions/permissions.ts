import { hasPermission } from "@/services/clerk/lib/hasPermission"

export async function canCreateQuestion() {
  return hasPermission("unlimited_question")
}
