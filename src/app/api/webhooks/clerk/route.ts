import { deleteUser, upsertUser } from "@/features/users/db"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>
  try {
    event = await verifyWebhook(request)
  } catch (error) {
    console.error("Clerk webhook verification failed:", error)
    return new Response("Invalid webhook", { status: 400 })
  }
  try {
    switch (event.type) {
      case "user.created":
      case "user.updated":
        const clerkData = event.data
        const email = clerkData.email_addresses.find(
          e => e.id === clerkData.primary_email_address_id
        )?.email_address
        if (email == null) {
          return new Response("No primary email found", { status: 400 })
        }

        await upsertUser({
          id: clerkData.id,
          email,
          name: `${clerkData.first_name} ${clerkData.last_name}`,
          imageUrl: clerkData.image_url,
          createdAt: new Date(clerkData.created_at),
          updatedAt: new Date(clerkData.updated_at),
        })

        break
      case "user.deleted":
        if (event.data.id == null) {
          return new Response("No user ID found", { status: 400 })
        }

        await deleteUser(event.data.id)
        break
    }
  } catch (error) {
    console.error("Failed to process Clerk webhook:", error)
    return new Response("Failed to process webhook", { status: 500 })
  }

  return new Response("Webhook received", { status: 200 })
}

