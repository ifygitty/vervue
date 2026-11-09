"use client"

import { Button } from "@/components/ui/button"
import { env } from "@/data/env/client"
import { JobInfo } from "@/data/dbTypes"
import { createInterview, updateInterview } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import { CondensedMessages } from "@/services/hume/components/CondensedMessages"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { useVoice, VoiceReadyState } from "@humeai/voice-react"
import {
  BrainCircuitIcon,
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

export function StartCall({
  jobInfo,
  user,
  accessToken,
}: {
  accessToken: string
  jobInfo: Pick<JobInfo, "id" | "title" | "description" | "experienceLevel">
  user: {
    name: string
    imageUrl: string
  }
}) {
  const { connect, readyState, chatMetadata, callDurationTimestamp } =
    useVoice()
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const durationRef = useRef(callDurationTimestamp)
  const router = useRouter()
  durationRef.current = callDurationTimestamp

  // Sync chat ID
  useEffect(() => {
    if (chatMetadata?.chatId == null || interviewId == null) {
      return
    }
    updateInterview(interviewId, { humeChatId: chatMetadata.chatId })
  }, [chatMetadata?.chatId, interviewId])

  // Sync duration
  useEffect(() => {
    if (interviewId == null) return
    const intervalId = setInterval(() => {
      if (durationRef.current == null) return

      updateInterview(interviewId, { duration: durationRef.current })
    }, 10000)

    return () => clearInterval(intervalId)
  }, [interviewId])

  // Handle disconnect
  useEffect(() => {
    if (readyState !== VoiceReadyState.CLOSED) return
    if (interviewId == null) {
      return router.push(`/app/job-infos/${jobInfo.id}/interviews`)
    }

    if (durationRef.current != null) {
      updateInterview(interviewId, { duration: durationRef.current })
    }
    router.push(`/app/job-infos/${jobInfo.id}/interviews/${interviewId}`)
  }, [interviewId, readyState, router, jobInfo.id])

  if (readyState === VoiceReadyState.IDLE) {
    return (
      <div className="container flex justify-center items-center min-h-screen-header py-10">
        <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary-ink">
            <MicIcon className="size-7" />
          </div>
          <p className="mb-2 text-sm font-medium text-primary-ink">
            VOICE INTERVIEW
          </p>
          <h1 className="text-2xl font-semibold">Ready to practice?</h1>
          <p className="mx-auto mt-3 mb-7 max-w-sm text-sm leading-6 text-muted-foreground">
            Your AI interviewer will guide you through a conversation tailored
            to your job description.
          </p>
          <Button
            size="lg"
            onClick={async () => {
              const res = await createInterview({ jobInfoId: jobInfo.id })
              if (res.error) {
                return errorToast(res.message)
              }
              setInterviewId(res.id)

              connect({
                auth: { type: "accessToken", value: accessToken },
                configId: env.NEXT_PUBLIC_HUME_CONFIG_ID,
                sessionSettings: {
                  type: "session_settings",
                  variables: {
                    userName: user.name,
                    title: jobInfo.title || "Not Specified",
                    description: jobInfo.description,
                    experienceLevel: jobInfo.experienceLevel,
                  },
                },
              })
            }}
          >
            Start Interview
          </Button>
        </div>
      </div>
    )
  }

  if (
    readyState === VoiceReadyState.CONNECTING ||
    readyState === VoiceReadyState.CLOSED
  ) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <Loader2Icon className="animate-spin size-24" />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen-header">
      <div className="container flex min-h-screen-header max-w-5xl flex-col items-center gap-6 py-8">
        <VoiceStatus />
        <Messages user={user} />
        <Controls />
      </div>
    </div>
  )
}

function Messages({ user }: { user: { name: string; imageUrl: string } }) {
  const { messages } = useVoice()

  const condensedMessages = useMemo(() => {
    return condenseChatMessages(messages)
  }, [messages])

  return (
    <CondensedMessages
      messages={condensedMessages}
      user={user}
      className="max-w-3xl flex-1"
    />
  )
}

function VoiceStatus() {
  const { isPlaying, isMuted, micFft, messages } = useVoice()
  const userSpeaking = !isMuted && micFft.some(value => value > 0.15)
  const lastMessage = [...messages].reverse().find(
    message =>
      message.type === "user_message" || message.type === "assistant_message"
  )
  const status = isPlaying
    ? "Interviewer speaking"
    : userSpeaking
      ? "You are speaking"
      : isMuted
        ? "Microphone muted"
        : lastMessage?.type === "user_message"
          ? "Waiting for interviewer"
          : "Listening"

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl border bg-card text-primary-ink">
        <BrainCircuitIcon className="size-7" />
      </div>
      <div>
        <p className="font-semibold">AI interviewer</p>
        <p
          className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          {status}
        </p>
      </div>
    </div>
  )
}

function Controls() {
  const { disconnect, isMuted, mute, unmute, micFft, callDurationTimestamp } =
    useVoice()

  return (
    <div className="sticky bottom-4 flex w-fit max-w-full items-center gap-4 rounded-xl border bg-card px-4 py-3">
      <Button
        variant={isMuted ? "outline" : "default"}
        size="icon"
        onClick={() => (isMuted ? unmute() : mute())}
        aria-pressed={isMuted}
      >
        {isMuted ? <MicOffIcon /> : <MicIcon />}
        <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
      </Button>
      <div className="h-8" aria-hidden="true">
        <FftVisualizer fft={micFft} />
      </div>
      <div className="text-sm text-muted-foreground tabular-nums">
        {callDurationTimestamp}
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={disconnect}
      >
        <PhoneOffIcon />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  )
}

function FftVisualizer({ fft }: { fft: number[] }) {
  return (
    <div className="flex gap-1 items-center h-full">
      {fft.slice(0, 20).map((value, index) => {
        const percent = Math.max(8, Math.min(100, (value / 4) * 100))
        return (
          <div
            key={index}
            className="bg-primary w-0.5 rounded transition-[height] duration-150 motion-reduce:transition-none"
            style={{ height: `${percent}%` }}
          />
        )
      })}
    </div>
  )
}
