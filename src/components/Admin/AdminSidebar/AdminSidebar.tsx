import { TrendingUp, Users, GraduationCap, Gift, X, Home } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface AdminSidebarProps {
  currentSection: string
  secretHash: string
  isOpen: boolean
  onToggle: () => void
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: 'dashboard' },
  { id: 'jovenes', label: 'Jóvenes', icon: Users, path: 'jovenes' },
  { id: 'cumpleanos', label: 'Cumpleaños', icon: Gift, path: 'cumpleanos' },
  { id: 'clases', label: 'Clases', icon: GraduationCap, path: 'clases' },
]

export default function AdminSidebar({ currentSection, secretHash, isOpen, onToggle }: AdminSidebarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (!isMobile) {
    // ─── Desktop: sidebar fija siempre visible ─────────────────────────────
    return (
      <aside
        style={{
          width: '250px',
          height: '100vh',
          backgroundColor: '#2e2c37',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 12px',
          boxSizing: 'border-box',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        <SidebarContent
          currentSection={currentSection}
          secretHash={secretHash}
          onToggle={onToggle}
        />
      </aside>
    )
  }

  // ─── Mobile: overlay drawer ──────────────────────────────────────────
  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: '#2e2c37',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 12px',
          boxSizing: 'border-box',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 200,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Close button */}
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        <SidebarContent
          currentSection={currentSection}
          secretHash={secretHash}
          onToggle={onToggle}
        />
      </aside>
    </>
  )
}

// ─── Contenido compartido entre desktop y mobile ─────────────────────
function SidebarContent({
  currentSection,
  secretHash,
  onToggle,
}: {
  currentSection: string
  secretHash: string
  onToggle?: () => void
}) {
  return (
    <>
      {/* Logo / Título */}
      <div style={{ padding: '0 12px 32px 12px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.02em',
          }}
        >
          Admin Panel
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '0.75rem',
            color: '#9ca3af',
          }}
        >
          Ministerio Filadelfia
        </p>
      </div>

      {/* Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sidebarItems.map((item) => {
          const isActive = currentSection === item.id
          return (
            <a
              key={item.id}
              href={`${secretHash}/${item.path}`}
              onClick={onToggle}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#ffffff' : '#9ca3af',
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#e5e7eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ flexShrink: 0 }}
              />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Botón Volver al Inicio */}
      <div style={{ marginTop: 'auto' }}>
        <a
          href="#/"
          onClick={onToggle}
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 400,
            color: '#9ca3af',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          <Home size={18} strokeWidth={1.5} />
          <span>Ir al Inicio</span>
        </a>

        {/* Versión / footer */}
        <div style={{ padding: '16px 12px 0 12px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              color: '#6b7280',
            }}
          >
            v1.0.0
          </p>
        </div>
      </div>
    </>
  )
}
