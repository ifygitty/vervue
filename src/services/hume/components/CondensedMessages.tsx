import { UserAvatar } from "@/features/users/components/UserAvatar"
import { cn } from "@/lib/utils"
import { BrainCircuitIcon } from "lucide-react"

export function CondensedMessages({
  messages,
  user,
  className,
}: {
  messages: { isUser: boolean; content: string[] }[]
  user: { name: string; imageUrl: string }
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4 border px-4 py-4 rounded-xl max-w-[90%] sm:max-w-3/4",
              message.isUser ? "self-end bg-secondary" : "self-start bg-card"
            )}
          >
            {message.isUser ? (
              <UserAvatar user={user} className="size-6 flex-shrink-0" />
            ) : (
              <BrainCircuitIcon className="size-6 flex-shrink-0 text-primary-ink" />
            )}
            <div className="flex flex-col gap-1 leading-relaxed">
              {message.content.map((text, i) => (
                <span key={i}>{text}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
