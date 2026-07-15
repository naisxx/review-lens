import { cn } from '@/lib/utils'

/** Deterministic hue per brand name. */
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 360
}

/** 1–2 letter monogram: initials of the first two words, else first two letters. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/**
 * Monogram "logo" badge — a stand-in for real brand logos (we have no logo
 * assets), coloured deterministically per brand so each is recognisable.
 */
export function BrandLogo({ name, className }: { name: string; className?: string }) {
  const hue = hashHue(name)
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[8px] font-bold leading-none text-white/95 ring-1 ring-inset ring-white/10',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 50% 48%), hsl(${(hue + 24) % 360} 55% 38%))`,
      }}
    >
      {initials(name)}
    </span>
  )
}
