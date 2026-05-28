// src/components/Admin/peopleTable/hooks/useClickOutside.ts
import { useEffect, type RefObject } from 'react'

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutside = refs.every(
        ref => ref.current && !ref.current.contains(target)
      )
      if (isOutside) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, enabled])
}
