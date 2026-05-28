// src/components/Admin/peopleTable/hooks/useFloatingMenu.ts
import { useState, useLayoutEffect, type RefObject } from 'react'

export interface FloatingMenuOptions {
  gap?: number
  alignRight?: boolean
}

function calculatePosition(
  triggerRect: DOMRect,
  menuRect: DOMRect,
  gap: number,
  alignRight: boolean
): React.CSSProperties {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const openAbove =
    triggerRect.bottom + menuRect.height + gap > viewportHeight &&
    triggerRect.top > menuRect.height + gap
  const top = openAbove
    ? Math.max(gap, triggerRect.top - menuRect.height - gap)
    : Math.min(viewportHeight - menuRect.height - gap, triggerRect.bottom + gap)

  const left = alignRight
    ? Math.min(
        viewportWidth - menuRect.width - gap,
        Math.max(gap, triggerRect.right - menuRect.width)
      )
    : Math.min(
        viewportWidth - menuRect.width - gap,
        Math.max(gap, triggerRect.left)
      )

  return { position: 'fixed', top, left, zIndex: 1000 }
}

export function useFloatingMenu(
  triggerRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  options: FloatingMenuOptions = {}
) {
  const { gap = 8, alignRight = false } = options
  const [styles, setStyles] = useState<React.CSSProperties>({})
  const [isPositioned, setIsPositioned] = useState(false)

  const estimatePosition = (estimatedSize: { width: number; height: number }) => {
    if (!triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const fakeRect = {
      ...triggerRect,
      width: estimatedSize.width,
      height: estimatedSize.height,
      top: triggerRect.bottom,
      bottom: triggerRect.bottom + estimatedSize.height,
      left: triggerRect.left,
      right: triggerRect.left + estimatedSize.width,
      toJSON: () => ({}),
    }
    setStyles(calculatePosition(triggerRect, fakeRect, gap, alignRight))
    setIsPositioned(true)
  }

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) {
      setIsPositioned(false)
      return
    }

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const menuRect = menuRef.current.getBoundingClientRect()
    setStyles(calculatePosition(triggerRect, menuRect, gap, alignRight))
    setIsPositioned(true)
  }, [isOpen, gap, alignRight, triggerRef, menuRef])

  return { styles, isPositioned, estimatePosition }
}
