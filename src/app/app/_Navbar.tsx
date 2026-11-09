"use client"

import {
  BookOpenIcon,
  FileSlidersIcon,
  LogOut,
  SpeechIcon,
  User,
} from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { UserAvatar } from "@/features/users/components/UserAvatar"
import { useParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/BrandLogo"

const navLinks = [
  { name: "Interviews", href: "interviews", Icon: SpeechIcon },
  { name: "Questions", href: "questions", Icon: BookOpenIcon },
  { name: "Resume", href: "resume", Icon: FileSlidersIcon },
]

export function Navbar({ user }: { user: { name: string; imageUrl: string } }) {
  const { openUserProfile } = useClerk()
  const { jobInfoId } = useParams()
  const pathName = usePathname()

  return (
    <nav className="h-header border-b bg-background">
      <div className="container flex h-full items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <BrandLogo />
        </Link>

        <div className="flex items-center gap-4">
          {typeof jobInfoId === "string" &&
            navLinks.map(({ name, href, Icon }) => {
              const hrefPath = `/app/job-infos/${jobInfoId}/${href}`

              return (
                <Button
                  variant={pathName === hrefPath || pathName.startsWith(`${hrefPath}/`) ? "secondary" : "ghost"}
                  key={name}
                  asChild
                  className={pathName === hrefPath || pathName.startsWith(`${hrefPath}/`) ? "cursor-pointer max-sm:hidden bg-accent text-primary-ink" : "cursor-pointer max-sm:hidden"}
                >
                  <Link href={hrefPath}>
                    <Icon />
                    {name}
                  </Link>
                </Button>
              )
            })}

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account and navigation menu">
              <UserAvatar user={user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {typeof jobInfoId === "string" &&
                navLinks.map(({ name, href, Icon }) => (
                  <DropdownMenuItem key={href} asChild className="sm:hidden">
                    <Link href={`/app/job-infos/${jobInfoId}/${href}`}>
                      <Icon />
                      {name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem onClick={() => openUserProfile()}>
                <User className="mr-2" />
                Profile
              </DropdownMenuItem>
              <SignOutButton>
                <DropdownMenuItem>
                  <LogOut className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
