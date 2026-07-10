import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

/**
 * Subtle count-up. Animates from the previous value to the next on change,
 * so filter updates read as a smooth transition rather than a hard cut.
 */
export function CountUp({
  value,
  format,
  duration = 0.7,
  className,
}: {
  value: number
  format: (v: number) => string
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value) return
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}
