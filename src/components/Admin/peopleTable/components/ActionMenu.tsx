// src/components/Admin/peopleTable/components/ActionMenu.tsx
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Edit2, Trash2, RotateCcw, MoreHorizontal } from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'
import { useFloatingMenu } from '../hooks/useFloatingMenu'
import type { ActionMenuProps } from '../types'

export default function ActionMenu<T>({
  row,
  onView,
  onEdit,
  onDelete,
  onRestore,
  deletedView = false,
}: ActionMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { styles, isPositioned } = useFloatingMenu(triggerRef, dropdownRef, isOpen)

  useClickOutside([triggerRef, dropdownRef], () => setIsOpen(false), isOpen)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="action-menu-container" ref={triggerRef}>
      <button
        className="action-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="action-menu-dropdown"
            style={{
              ...styles,
              visibility: isPositioned ? 'visible' : 'hidden',
            }}
          >
            {onView && (
              <button
                className="action-menu-item"
                onClick={() => handleAction(() => onView(row))}
                type="button"
              >
                <Eye size={16} />
                <span>Ver</span>
              </button>
            )}
            {onEdit && (
              <button
                className="action-menu-item"
                onClick={() => handleAction(() => onEdit(row))}
                type="button"
              >
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
            )}
            {deletedView && onRestore ? (
              <button
                className="action-menu-item restore-item"
                onClick={() => handleAction(() => onRestore(row))}
                type="button"
              >
                <RotateCcw size={16} />
                <span>Restaurar</span>
              </button>
            ) : (
              onDelete && (
                <button
                  className="action-menu-item delete-item"
                  onClick={() => handleAction(() => onDelete(row))}
                  type="button"
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              )
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
