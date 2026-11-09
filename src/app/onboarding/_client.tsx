"use client"

import { Button } from "@/components/ui/button"
import { completeOnboarding } from "@/features/users/actions"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function OnboardingClient() {
  const router = useRouter()
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setError(null)
    async function setup() {
      try {
        const result = await completeOnboarding()
        if (!active) return
        if (result.success) {
          router.replace("/app")
        } else {
          setError(result.message)
        }
      } catch (error) {
        console.error("Onboarding request failed:", error)
        if (active) {
          setError("Could not reach the server. Please try again.")
        }
      }
    }
    void setup()

    return () => {
      active = false
    }
  }, [attempt, router])

  if (error != null) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p role="alert">{error}</p>
        <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button>
      </div>
    )
  }
  return <Loader2Icon className="animate-spin size-24" />
}
