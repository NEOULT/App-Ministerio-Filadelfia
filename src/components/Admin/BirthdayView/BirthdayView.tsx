// src/components/Admin/BirthdayView/BirthdayView.tsx
import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Bell, Cake, MessageCircle } from 'lucide-react'
import type { Persona } from '@/components/Admin/peopleTable/types'
import { getNombreCompleto, calcularEdad, getBirthMonthFromFechaNacimiento } from '@/components/Admin/peopleTable/utils/personUtils'
import Modal from '@/components/ui/Modal/Modal'
import './BirthdayView.css'

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface BirthdayViewProps {
  personas: Persona[]
}

type MonthOption = { value: number; label: string }

const MONTHS: MonthOption[] = [
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBirthDay(fecha?: string): number | null {
  if (!fecha) return null
  const [fechaParte] = fecha.split('T')
  const [, , day] = fechaParte.split('-')
  const d = Number.parseInt(day, 10)
  return Number.isNaN(d) ? null : d
}

/** Return the label for "today", "tomorrow", or the weekday name */
function getDayLabel(fecha?: string): string {
  if (!fecha) return ''
  const today = new Date()
  // Normalizar a medianoche para comparar solo fechas, sin hora
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [fechaParte] = fecha.split('T')
  const [, month, day] = fechaParte.split('-')
  const birthThisYear = new Date(today.getFullYear(), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10))

  const diffDays = Math.round((birthThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'HOY'
  if (diffDays === 1) return 'MAÑANA'

  const weekday = birthThisYear.toLocaleDateString('es-ES', { weekday: 'long' })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

/** Get this week's birthdays from a list */
function getThisWeekBirthdays(personas: Persona[], currentMonth: number): PersonaWithBirthday[] {
  const today = new Date()
  // Usar solo la parte de fecha (sin hora) para evitar desfases
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfWeek = new Date(todayDate)
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay()) // Sunday
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday

  return personas
    .filter((p) => getBirthMonthFromFechaNacimiento(p.fecha_nacimiento) === currentMonth)
    .map((p) => ({ persona: p, birthDay: getBirthDay(p.fecha_nacimiento)!, birthMonth: currentMonth }))
    .filter((item) => {
      const year = today.getFullYear()
      const birthDate = new Date(year, currentMonth - 1, item.birthDay)
      return birthDate >= startOfWeek && birthDate <= endOfWeek
    })
    .sort((a, b) => a.birthDay - b.birthDay)
}

interface PersonaWithBirthday {
  persona: Persona
  birthDay: number
  birthMonth: number
}

// ─── Componente Calendario ─────────────────────────────────────────────────

function MiniCalendar({ currentMonth: propMonth }: { currentMonth: number }) {
  const today = new Date()
  const currentYear = today.getFullYear()
  // If we're showing months Jun-Dec, use current year; for Jan-Feb, use next year
  const year = propMonth <= 2 ? currentYear + 1 : currentYear
  const [viewDate, setViewDate] = useState(new Date(year, propMonth - 1, 1))

  // Sync viewDate when propMonth changes
  const [prevMonth, setPrevMonth] = useState(propMonth)

  useEffect(() => {
    if (propMonth !== prevMonth) {
      const newYear = propMonth <= 2 ? currentYear + 1 : currentYear
      setViewDate(new Date(newYear, propMonth - 1, 1))
      setPrevMonth(propMonth)
    }
  }, [propMonth, prevMonth, currentYear])

  const month = viewDate.getMonth()
  const displayYear = viewDate.getFullYear()

  const daysInMonth = new Date(displayYear, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(displayYear, month, 1).getDay()

  const prevMonthDays = new Date(displayYear, month, 0).getDate()

  const goBack = () => setViewDate(new Date(displayYear, month - 1, 1))
  const goForward = () => setViewDate(new Date(displayYear, month + 1, 1))

  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const cells: React.ReactNode[] = []

  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(
      <div key={`empty-${i}`} style={{ textAlign: 'center', padding: '4px 0', fontSize: '0.75rem', color: '#d1d5db' }}>
        {prevMonthDays - firstDayOfWeek + 1 + i}
      </div>,
    )
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === todayDate && month === todayMonth && displayYear === todayYear
    cells.push(
      <div
        key={day}
        style={{
          textAlign: 'center',
          padding: '4px 0',
          fontSize: '0.8rem',
          fontWeight: isToday ? 700 : 400,
          color: isToday ? '#ffffff' : '#374151',
          backgroundColor: isToday ? '#2e2c37' : 'transparent',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          cursor: 'default',
        }}
      >
        {day}
      </div>,
    )
  }

  return (
    <div>
      {/* Header: month/year + nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button onClick={goBack} style={navBtnStyle} aria-label="Mes anterior">
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>
          {MONTH_NAMES[month]} {displayYear}
        </span>
        <button onClick={goForward} style={navBtnStyle} aria-label="Mes siguiente">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px',
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#9ca3af',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
        }}
      >
        {cells}
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  transition: 'all 0.15s',
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function BirthdayView({ personas }: BirthdayViewProps) {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 1-12

  // Default to the current month if within our range, else Junio
  const defaultMonth = currentMonth >= 6 || currentMonth <= 2 ? currentMonth : 6
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonaWithBirthday | null>(null)

  // Compute data in a single pass
  const { monthBirthdays, thisWeekBirthdays, totalCount, upcomingBirthdays } = useMemo(() => {
    const monthBdays = personas
      .filter((p) => getBirthMonthFromFechaNacimiento(p.fecha_nacimiento) === selectedMonth)
      .map((p) => ({ persona: p, birthDay: getBirthDay(p.fecha_nacimiento)!, birthMonth: selectedMonth }))
      .sort((a, b) => a.birthDay - b.birthDay)

    const thisWeek = getThisWeekBirthdays(personas, selectedMonth)

    const upcoming = monthBdays.filter((b) => {
      const birthDate = new Date(new Date().getFullYear(), selectedMonth - 1, b.birthDay)
      const diff = Math.round((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 1 && !isNaN(diff)
    })

    return {
      monthBirthdays: monthBdays,
      thisWeekBirthdays: thisWeek,
      totalCount: monthBdays.length,
      upcomingBirthdays: upcoming.slice(0, 12),
    }
  }, [personas, selectedMonth])

  return (
    <>
      <section>
      {/* Título */}
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 24px 0',
        }}
      >
        Cumpleaños
      </h1>

      {/* Navegación de meses */}
      <MonthTabs months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />

      {/* Panel principal */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #6b7280',
          borderRight: '1px solid #6b7280',
          borderBottom: '1px solid #6b7280',
          borderTop: 'none',
          borderRadius: '0 12px 12px 12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: '0',
            alignItems: 'start',
          }}
          className="birthday-grid"
        >
          {/* ─── Columna izquierda: contenido principal ─────────────── */}
          <div
            className="birthday-scroll"
            style={{
              padding: '28px 32px',
              borderRight: '1px solid #d1d5db',
              maxHeight: 'calc(100vh - 280px)',
            }}
          >
            <div className="birthday-content" key={selectedMonth}>
              {/* Resumen del mes */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Total de cumpleañeros del mes
                </span>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  {totalCount}
                </span>
              </div>

              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid #d1d5db',
                  margin: '0 0 28px 0',
                }}
              />

              {/* Esta Semana */}
              {thisWeekBirthdays.length > 0 && (
                <>
                  <h2
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 16px 0',
                    }}
                  >
                    Esta semana
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                      marginBottom: '32px',
                    }}
                  >
                    {thisWeekBirthdays.map((item, idx) => (
                      <BirthdayCard key={idx} item={item} onClick={() => setSelectedPerson(item)} />
                    ))}
                  </div>
                </>
              )}

              {/* Próximos de este Mes */}
              {upcomingBirthdays.length > 0 && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: 0,
                      }}
                    >
                      Próximos de este Mes
                    </h2>
                    <span
                      onClick={() => setShowAllModal(true)}
                      style={{
                        fontSize: '0.8rem',
                        color: '#6366f1',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6366f1' }}
                    >
                      Ver todos
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {upcomingBirthdays.slice(0, 6).map((item, idx) => (
                      <UpcomingCard key={idx} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─── Columna derecha: calendario ────────────────────────── */}
          <div style={{ padding: '28px 20px' }}>
            <MiniCalendar currentMonth={selectedMonth} />
          </div>
        </div>
      </div>
    </section>

      {/* Modal Ver todos del mes */}
      <Modal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        title={`Todos los cumpleaños de ${MONTH_NAMES[selectedMonth - 1]}`}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {monthBirthdays.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem' }}>
              No hay cumpleañeros para este mes
            </p>
          ) : (
            monthBirthdays.map((item, idx) => {
              const name = getNombreCompleto(item.persona)
              const edad = calcularEdad(item.persona.fecha_nacimiento)
              const label = getDayLabel(item.persona.fecha_nacimiento)
              const badgeColors: Record<string, { bg: string; text: string }> = {
                HOY: { bg: '#dcfce7', text: '#16a34a' },
                MAÑANA: { bg: '#fef3c7', text: '#d97706' },
              }
              const badgeColor = badgeColors[label] ?? { bg: '#f3f4f6', text: '#6b7280' }

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {/* Día */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                      {item.birthDay}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#9ca3af', textTransform: 'uppercase', lineHeight: 1 }}>
                      {MONTH_NAMES[selectedMonth - 1].slice(0, 3)}
                    </span>
                  </div>

                  {/* Avatar / foto */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#9ca3af',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {item.persona.imagen_url ? (
                      <img
                        src={item.persona.imagen_url}
                        alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {edad !== null ? `${edad} años` : '—'}
                    </div>
                  </div>

                  {/* Badge HOY/MAÑANA */}
                  {(label === 'HOY' || label === 'MAÑANA') && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: badgeColor.text,
                        backgroundColor: badgeColor.bg,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                  )}

                  {/* Icono pastel */}
                  <Cake size={16} style={{ flexShrink: 0, color: '#d1d5db' }} />
                </div>
              )
            })
          )}
        </div>
      </Modal>
      {/* Modal persona */}
      <BirthdayPersonModal
        item={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </>
  )
}

// ─── Componentes internos ──────────────────────────────────────────────────

function MonthTabs({
  months,
  selected,
  onSelect,
}: {
  months: MonthOption[]
  selected: number
  onSelect: (value: number) => void
}) {
  return (
    <div
      className="month-tabs-scroll"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: '0',
        overflowX: 'auto',
      }}
    >
      {months.map((m) => {
        const isActive = m.value === selected
        return (
          <button
            key={m.value}
            onClick={() => onSelect(m.value)}
            style={{
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#111827' : '#6b7280',
              backgroundColor: isActive ? '#ffffff' : '#f9fafb',
              borderTop: isActive ? '1px solid #6b7280' : '1px solid transparent',
              borderRight: isActive ? '1px solid #6b7280' : '1px solid transparent',
              borderLeft: isActive ? '1px solid #6b7280' : '1px solid transparent',
              borderBottom: isActive ? 'none' : '1px solid #6b7280',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderTop = '1px solid #d1d5db'
                e.currentTarget.style.borderRight = '1px solid #d1d5db'
                e.currentTarget.style.borderLeft = '1px solid #d1d5db'
                e.currentTarget.style.borderBottom = '1px solid #6b7280'
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderTop = '1px solid transparent'
                e.currentTarget.style.borderRight = '1px solid transparent'
                e.currentTarget.style.borderLeft = '1px solid transparent'
                e.currentTarget.style.borderBottom = '1px solid #6b7280'
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.color = '#6b7280'
              }
            }}
          >
            {m.label}
          </button>
        )
      })}
      {/* Spacer que completa la línea superior donde no hay botones */}
      <div
        style={{
          flex: 1,
          borderTop: '1px solid #6b7280',
          alignSelf: 'flex-end',
          height: 0,
        }}
      />
    </div>
  )
}

function BirthdayCard({ item, onClick }: { item: PersonaWithBirthday; onClick: () => void }) {
  const name = getNombreCompleto(item.persona)
  const edad = calcularEdad(item.persona.fecha_nacimiento)
  const label = getDayLabel(item.persona.fecha_nacimiento)
  const faltas = (item.persona as Record<string, unknown>).faltas as number | undefined

  // Determinar color del badge
  const badgeColors: Record<string, { bg: string; text: string }> = {
    HOY: { bg: '#dcfce7', text: '#16a34a' },
    MAÑANA: { bg: '#fef3c7', text: '#d97706' },
  }
  const badgeColor = badgeColors[label] ?? { bg: '#f3f4f6', text: '#6b7280' }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '160px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6'
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb'
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Badge */}
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: badgeColor.text,
          backgroundColor: badgeColor.bg,
          padding: '3px 10px',
          borderRadius: '999px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>

      {/* Avatar / foto */}
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: 600,
          color: '#9ca3af',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {item.persona.imagen_url ? (
          <img
            src={item.persona.imagen_url}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Nombre */}
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#111827',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {name.split(' ')[0]}
      </span>

      {/* Edad */}
      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
        {edad !== null ? `${edad} años` : '—'}
      </span>

      {/* Estadísticas: asistencias / faltas */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: '#374151' }}>—</div>
          <div>Asistencias</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: faltas && faltas > 2 ? '#dc2626' : '#374151' }}>
            {faltas ?? '—'}
          </div>
          <div>Faltas</div>
        </div>
      </div>

      {/* Indicador visual de clic */}
      <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>
        Ver más →
      </span>
    </div>
  )
}

function UpcomingCard({ item }: { item: PersonaWithBirthday }) {
  const name = getNombreCompleto(item.persona)
  const [fechaParte] = (item.persona.fecha_nacimiento ?? '').split('T')
  const [, month, day] = fechaParte.split('-')
  const monthName = MONTH_NAMES[Number.parseInt(month, 10) - 1] ?? ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #f3f4f6',
        backgroundColor: '#ffffff',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb'
        e.currentTarget.style.borderColor = '#e5e7eb'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff'
        e.currentTarget.style.borderColor = '#f3f4f6'
      }}
    >
      {/* Avatar / foto */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#9ca3af',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {item.persona.imagen_url ? (
          <img
            src={item.persona.imagen_url}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {day} de {monthName}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          style={{
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.color = '#6366f1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
          aria-label="Recordatorio"
        >
          <Bell size={14} />
        </button>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
          }}
          aria-label="Más opciones"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Modal de persona ─────────────────────────────────────────────────────

function BirthdayPersonModal({
  item,
  onClose,
}: {
  item: PersonaWithBirthday | null
  onClose: () => void
}) {
  if (!item) return null

  const name = getNombreCompleto(item.persona)
  const edad = calcularEdad(item.persona.fecha_nacimiento)
  const [fechaParte] = (item.persona.fecha_nacimiento ?? '').split('T')
  const [, month, day] = fechaParte.split('-')
  const monthName = MONTH_NAMES[Number.parseInt(month, 10) - 1] ?? ''
  const faltas = (item.persona as Record<string, unknown>).faltas as number | undefined
  const imageUrl = item.persona.imagen_url || ''
  const defaultMessage = `🎂 ¡Feliz cumpleaños ${name.split(' ')[0]}! 🎉\n\n` +
    `Que este nuevo año venga lleno de bendiciones, salud y mucho éxito. 🙏✨\n\n` +
    `¡Te deseamos lo mejor en este día tan especial! 🎁🎈\n\n` +
    `— Con cariño, el equipo ✨` +
    (imageUrl ? `\n\n${imageUrl}` : '')
  const [whatsappText, setWhatsappText] = useState(defaultMessage)
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Información del cumpleañero"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header con avatar y nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#6b7280',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              {name}
            </h3>
            <span
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              {edad !== null ? `${edad} años` : ''}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <InfoItem label="Fecha de cumpleaños" value={`${day} de ${monthName}`} />
          <InfoItem label="Cédula" value={String(item.persona.cedula ?? '—')} />
          <InfoItem label="Ministerio" value={item.persona.ministerio ?? '—'} />
          <InfoItem label="Faltas" value={faltas !== undefined ? String(faltas) : '—'} isWarning={faltas !== undefined && faltas > 2} />
        </div>

        {/* Separator */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />

        {/* Mensaje editable */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
            Mensaje a enviar
          </label>
          <textarea
            value={whatsappText}
            onChange={(e) => setWhatsappText(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: '0.85rem',
              color: '#111827',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
          />
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Botón felicitar */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#25D366',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1da851'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#25D366'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <MessageCircle size={20} />
            Felicitar
          </a>
        </div>
      </div>
    </Modal>
  )
}

function InfoItem({
  label,
  value,
  isWarning = false,
}: {
  label: string
  value: string
  isWarning?: boolean
}) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 500,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: isWarning ? '#dc2626' : '#111827',
        }}
      >
        {value}
      </div>
    </div>
  )
}
