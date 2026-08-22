// src/components/Admin/AdminHeader/AdminHeader.tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Menu } from 'lucide-react'

interface AdminHeaderProps {
  onMenuToggle?: () => void
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {isMobile && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
              flexShrink: 0,
            }}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.875rem',
            fontWeight: 700,
            color: '#1f2937'
          }}>
            Panel de Administración
          </h1>
          {!isMobile && (
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Gestiona jóvenes y clases de la iglesia
            </p>
          )}
        </div>
      </div>
    </div>
  )
}