"use server"

import { currentUser } from "@clerk/nextjs/server"
import { createUserIfMissing } from "./db"

export async function completeOnboarding(): Promise<
  { success: true } | { success: false; message: string }
> {
  try {
    const user = await currentUser()
    if (user == null) {
      return { success: false, message: "Your session has expired. Please sign in again." }
    }

    const email = user.primaryEmailAddress?.emailAddress
    if (email == null) {
      return {
        success: false,
        message: "Your account needs a primary email address in Clerk before setup can finish.",
      }
    }

    await createUserIfMissing({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email,
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to complete onboarding:", error)
    return {
      success: false,
      message: "Account setup failed. Check the server terminal for details, then try again.",
    }
  }
}
