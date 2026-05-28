// src/components/Admin/DashboardView/DashboardView.tsx
import { Calendar, CalendarDays, Church, RefreshCw, AlertOctagon } from 'lucide-react'
import StatsCard from '@/components/Admin/StatsCard/StatsCard'
import PeopleTable from '@/components/Admin/peopleTable/peopleTable'
import type { Persona, ExtraField } from '@/components/Admin/peopleTable/types'
import type { FiltersState } from '@/components/Admin/peopleTable/FilterDropdown'
import type { EstadisticasResponse } from '@/services/Api'
import { Button } from '@/components/ui/button'

type Column<T> = {
  key: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => React.ReactNode
}

interface DashboardViewProps {
  personas: Persona[]
  estadisticas: EstadisticasResponse
  loadingEstadisticas?: boolean
  loadingPersonas?: boolean
  onView?: (persona: Persona) => void  // ← Añadir onView
  onEdit: (persona: Persona) => void
  onDelete: (persona: Persona) => void
  onRestore: (persona: Persona) => void
  onSearch: (searchTerm: string) => void
  onExport: () => void
  onFilter: (filters: FiltersState) => void
  onCreate: () => void
  onRefresh?: () => void
  personColumns: Column<Persona>[]
  extraExportFields?: ExtraField[]
}

export default function DashboardView({
  personas,
  estadisticas,
  loadingEstadisticas = false,
  loadingPersonas = false,
  onView,  // ← Recibir onView
  onEdit,
  onDelete,
  onRestore,
  onSearch,
  onExport,
  onFilter,
  onCreate,
  onRefresh,
  personColumns,
  extraExportFields
}: DashboardViewProps) {
  
  // Paleta de colores pastel
  const statsData = [
    {
      id: 1,
      title: "Jóvenes > 2 Faltas",
      icon: <AlertOctagon size={22} strokeWidth={1.5} />,
      value: estadisticas.personasConMasDe2Faltas,
      description: "Jóvenes con más de 2 faltas en el mes",
      backgroundColor: "#fce4ec",
      iconColor: "#e91e63",
      textColor: "#111827",
      loading: loadingEstadisticas
    },
    {
      id: 2,
      title: "Total Jóvenes",
      icon: <Church size={22} strokeWidth={1.5} />,
      value: personas.length,
      description: "Jóvenes registrados en la base de datos",
      backgroundColor: "#e8eaf6",
      iconColor: "#5c6bc0",
      textColor: "#111827",
      loading: loadingEstadisticas
    },
    {
      id: 3,
      title: "Promedio Asist. Semanal",
      icon: <Calendar size={22} strokeWidth={1.5} />,
      value: estadisticas.promedioAsistenciaSemanal,
      description: "Jovenes que asisten por semana",
      backgroundColor: "#e0f7fa",
      iconColor: "#00acc1",
      textColor: "#111827",
      loading: loadingEstadisticas
    },
    {
      id: 4,
      title: "Promedio Asist. Mensual",
      icon: <CalendarDays size={22} strokeWidth={1.5} />,
      value: estadisticas.promedioAsistenciaMensual,
      description: "Jóvenes que asisten por mes",
      backgroundColor: "#fff3e0",
      iconColor: "#ff9800",
      textColor: "#111827",
      loading: loadingEstadisticas
    }
  ]

  return (
    <section>
      {onRefresh && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loadingEstadisticas || loadingPersonas}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loadingEstadisticas || loadingPersonas) ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {statsData.map((stat) => (
          <StatsCard
            key={stat.id}
            title={stat.title}
            icon={stat.icon}
            value={stat.value}
            description={stat.description}
            backgroundColor={stat.backgroundColor}
            iconColor={stat.iconColor}
            textColor={stat.textColor}
            loading={stat.loading}
          />
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <PeopleTable<Persona>
          title="Base de Datos de Jóvenes"
          data={personas}
          columns={personColumns}
          extraExportFields={extraExportFields}
          onSearch={onSearch}
          onExport={onExport}
          onFilter={onFilter}
          onCreate={onCreate}
          onView={onView}  // ← Pasar onView al PeopleTable
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          itemsPerPage={10}
          showActions={true}
          loading={loadingPersonas}
        />
      </div>
    </section>
  )
}