// src/components/Admin/StatsCard/StatsCard.tsx
import { useState, useEffect, useRef, useCallback } from 'react'

interface StatsCardProps {
  title: string
  icon: React.ReactNode
  value: string | number
  description?: string
  backgroundColor: string
  iconColor: string
  textColor: string
  loading?: boolean
}

// Variable global para controlar qué tooltip está abierto
let activeTooltipId: string | null = null
let activeTimeout: ReturnType<typeof setTimeout> | null = null

export default function StatsCard({
  title,
  icon,
  value,
  description,
  backgroundColor,
  iconColor,
  textColor,
  loading = false
}: StatsCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const cardId = useRef(`card-${Math.random()}`).current

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (activeTooltipId === cardId) {
        activeTooltipId = null
        if (activeTimeout) clearTimeout(activeTimeout)
      }
    }
  }, [cardId])

  const closeAllTooltips = () => {
    // Cerrar cualquier tooltip activo
    if (activeTooltipId !== null) {
      const event = new CustomEvent('closeTooltip', { detail: { id: activeTooltipId } })
      document.dispatchEvent(event)
      activeTooltipId = null
    }
    if (activeTimeout) {
      clearTimeout(activeTimeout)
      activeTimeout = null
    }
  }

  const showThisTooltip = () => {
    closeAllTooltips()
    setShowTooltip(true)
    activeTooltipId = cardId
    
    // Auto-cerrar después de 3 segundos en mobile
    if (isMobile) {
      activeTimeout = setTimeout(() => {
        setShowTooltip(false)
        if (activeTooltipId === cardId) activeTooltipId = null
        activeTimeout = null
      }, 3000)
    }
  }

  const hideThisTooltip = useCallback(() => {
    setShowTooltip(false)
    if (activeTooltipId === cardId) {
      activeTooltipId = null
    }
    if (activeTimeout) {
      clearTimeout(activeTimeout)
      activeTimeout = null
    }
  }, [cardId])

  // Escuchar evento de cierre global
  useEffect(() => {
    const handleCloseTooltip = (event: CustomEvent) => {
      if (event.detail.id === cardId) {
        setShowTooltip(false)
      }
    }
    
    document.addEventListener('closeTooltip', handleCloseTooltip as EventListener)
    return () => document.removeEventListener('closeTooltip', handleCloseTooltip as EventListener)
  }, [cardId])

  const handleMouseEnter = () => {
    if (!isMobile && description) {
      showThisTooltip()
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile && description) {
      hideThisTooltip()
    }
  }

  const handleClick = () => {
    if (isMobile && description) {
      if (showTooltip) {
        hideThisTooltip()
      } else {
        showThisTooltip()
      }
    }
  }

  // Cerrar tooltip al hacer click fuera (solo mobile)
  useEffect(() => {
    if (!isMobile) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showTooltip && !target.closest('.stats-card-container')) {
        hideThisTooltip()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showTooltip, isMobile, hideThisTooltip])

  return (
    <div className="stats-card-container" style={{ position: 'relative' }}>
      {/* Card principal */}
      <div
        style={{
          backgroundColor,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: description ? (isMobile ? 'pointer' : 'default') : 'default'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: textColor, opacity: 0.6, fontSize: '0.875rem', margin: '0 0 8px 0', fontWeight: 500 }}>
              {title}
            </p>
            {loading ? (
              <div style={{ 
                width: '60px', 
                height: '32px', 
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ) : (
              <h3 style={{ color: textColor, fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
                {value}
              </h3>
            )}
          </div>
          {/* Icono en la esquina superior derecha */}
          <div style={{ 
            color: iconColor,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        </div>
      </div>

      {/* Tooltip debajo de la card */}
      {showTooltip && description && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            zIndex: 10,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.2s ease-in-out',
            maxWidth: '90vw',
            whiteSpace: isMobile ? 'normal' : 'nowrap',
            wordBreak: 'break-word'
          }}
        >
          {description}
          {/* Triángulo/arrow del tooltip */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid #1f2937'
            }}
          />
        </div>
      )}

      {/* Animaciones */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .stats-card-container {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}