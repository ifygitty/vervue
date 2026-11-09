import Image from "next/image"

export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative block size-9 shrink-0 overflow-hidden rounded-md bg-black"
        aria-hidden="true"
      >
        <Image
          src="/vervue.png"
          alt=""
          width={1536}
          height={1024}
          className="absolute -left-[29px] -top-[44px] h-auto w-[192px] max-w-none"
        />
      </span>
      <span className="text-xl font-bold tracking-tight">Vervue</span>
    </span>
  )
}
