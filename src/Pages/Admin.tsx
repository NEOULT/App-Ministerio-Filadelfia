// src/Pages/Admin.tsx
import { useEffect, useState } from 'react'
import type { Persona, ExtraField } from '@/components/Admin/peopleTable/types'
import { usePersonas } from '@/hooks/usePersonas'
import { useStatistics } from '@/hooks/useStatistics'
import { getCurrentMonthRange } from '@/utils/dateUtils'
import { 
  getNombreCompleto, 
  calcularEdad, 
  formatearTelefono, 
  formatearGenero, 
  formatearFecha, 
  formatearBautizado 
} from '@/components/Admin/peopleTable/utils/personUtils'
import AdminLayout from '@/components/Admin/AdminLayout/AdminLayout'
import AdminHeader from '@/components/Admin/AdminHeader/AdminHeader'
import AdminTabs from '@/components/Admin/AdminTabs/AdminTabs'
import DashboardView from '@/components/Admin/DashboardView/DashboardView'
import JovenesView from '@/components/Admin/JovenesView/JovenesView'
import ClasesView from '@/components/Admin/ClasesView/ClasesView'
import ViewPersonModal from '@/components/Admin/Modals/ViewPersonModal'
import EditPersonModal from '@/components/Admin/Modals/EditPersonModal'
import DeletePersonModal from '@/components/Admin/Modals/DeletePersonModal'
import RestorePersonModal from '@/components/Admin/Modals/RestorePersonModal'
import CreatePersonModal from '@/components/Admin/Modals/CreatePersonModal'
import type { FiltersState } from '@/components/Admin/peopleTable/FilterDropdown'
import { updatePersona, softDeletePersona, restorePersona } from '@/services/Api'

type Column<T> = {
  key: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => React.ReactNode
}

export default function Admin() {
  const SECRET_ADMIN_HASH = '#/__sigma-astral-portal__c3d4e2-4f10'
  const [hash, setHash] = useState(window.location.hash)
  const [reload, setReload] = useState(0)
  const [showDeletedOnly, setShowDeletedOnly] = useState(false)
  
  // Estados para modales
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [modalView, setModalView] = useState<'view' | 'edit' | 'delete' | 'restore' | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Obtener rango del mes actual
  const { from, to } = getCurrentMonthRange()
  
  // Hooks para datos
  const personasHook = usePersonas(showDeletedOnly)
  const {
    personas,
    loading: loadingPersonas,
    searchPersonas,
    refreshPersonas
  } = personasHook
  
  const {
    estadisticas,
    loading: loadingEstadisticas,
    refreshEstadisticas
  } = useStatistics(from, to)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const getSection = () => {
    if (!hash.startsWith(SECRET_ADMIN_HASH)) return 'dashboard'
    const rest = hash.slice(SECRET_ADMIN_HASH.length) || ''
    const clean = rest.startsWith('/') ? rest.slice(1) : rest
    if (clean.startsWith('clases')) return 'clases'
    if (clean.startsWith('jovenes') || clean.startsWith('personas')) return 'jovenes'
    if (clean === '' || clean === 'dashboard') return 'dashboard'
    return 'dashboard'
  }

  const section = getSection()

  // Campos adicionales que existen en los datos pero no se muestran en la tabla
  const extraExportFields: ExtraField[] = [
    { key: 'email', label: 'Email' },
    { key: 'ministerio', label: 'Ministerio' },
    { key: 'nivel_academico', label: 'Nivel Académico' },
    { key: 'ocupacion', label: 'Ocupación' },
  ]

  // Columnas para la tabla de jóvenes
  const personColumns: Column<Persona>[] = [
    { 
      key: 'nombreCompleto', 
      label: 'Nombre y apellido', 
      align: 'left',
      render: (_, row) => getNombreCompleto(row)
    },
    { 
      key: 'cedula', 
      label: 'Cédula', 
      align: 'center',
      render: (value) => (value as number)?.toString() || '-'
    },
    { 
      key: 'telefono', 
      label: 'Teléfono', 
      align: 'center',
      render: (_, row) => formatearTelefono(row.telefono)
    },
    { 
      key: 'edad', 
      label: 'Edad', 
      align: 'center',
      render: (_, row) => {
        const edad = calcularEdad(row.fecha_nacimiento)
        return edad !== null ? edad.toString() : '-'
      }
    },
    { 
      key: 'genero', 
      label: 'Género', 
      align: 'center',
      render: (_, row) => formatearGenero(row.genero)
    },
    { 
      key: 'fecha_nacimiento', 
      label: 'Fecha Nac.', 
      align: 'center',
      render: (_, row) => formatearFecha(row.fecha_nacimiento)
    },
    { 
      key: 'bautizado', 
      label: 'Bautizado', 
      align: 'center',
      render: (_, row) => formatearBautizado(row.bautizado)
    },
    { 
      key: 'faltas', 
      label: 'Faltas', 
      align: 'center',
      render: (_, row) => {
        const faltas = (row as Record<string, unknown>).faltas as number | undefined
        if (faltas === undefined || faltas === null) return '-'
        const isAlert = faltas > 2
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: isAlert ? 700 : 500,
            backgroundColor: isAlert ? '#fef2f2' : '#f3f4f6',
            color: isAlert ? '#dc2626' : '#374151',
            border: isAlert ? '1px solid #fecaca' : '1px solid #e5e7eb',
          }}>
            {isAlert && <span style={{ fontSize: '0.75rem' }}>⚠️</span>}
            {faltas}
          </span>
        )
      }
    }
  ]

  const handleOnView = (persona: Persona) => {
    setSelectedPersona(persona)
    setModalView('view')
  }

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona)
    setModalView('edit')
  }

  const handleDelete = (persona: Persona) => {
    setSelectedPersona(persona)
    setModalView('delete')
  }

  const handleRestore = (persona: Persona) => {
    setSelectedPersona(persona)
    setModalView('restore')
  }

  const handleSaveEdit = async (updatedData: Partial<Persona>) => {
    try {
      if (!selectedPersona?._id) {
        throw new Error('No se encontró la persona a actualizar')
      }

      await updatePersona(selectedPersona._id, updatedData)
      // Recargar datos después de actualizar
      await refreshPersonas()
      await refreshEstadisticas()
    } catch (error) {
      console.error('Error al guardar:', error)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    try {
      if (!selectedPersona?._id) {
        throw new Error('No se encontró la persona a eliminar')
      }

      await softDeletePersona(selectedPersona._id)
      // Recargar datos después de eliminar
      await refreshPersonas()
      await refreshEstadisticas()
    } catch (error) {
      console.error('Error al eliminar:', error)
      throw error
    }
  }

  const handleConfirmRestore = async () => {
    try {
      if (!selectedPersona?._id) {
        throw new Error('No se encontró la persona a restaurar')
      }

      await restorePersona(selectedPersona._id)
      await refreshPersonas()
      await refreshEstadisticas()
    } catch (error) {
      console.error('Error al restaurar:', error)
      throw error
    }
  }

  const closeModal = () => {
    setModalView(null)
    setSelectedPersona(null)
  }

  const handleExport = () => {
    console.log('Exportar datos')
  }

  const handleFilter = (filters: FiltersState) => {
    setShowDeletedOnly(filters.deletedOnly)
  }

  const handleCreate = () => {
    setShowCreateModal(true)
  }

  const handleCreateSuccess = () => {
    refreshPersonas()
    refreshEstadisticas()
  }

  const handleRefresh = () => {
    refreshPersonas()
    refreshEstadisticas()
  }

  return (
    <>
      <AdminLayout>
        <AdminHeader />
        <AdminTabs currentSection={section} secretHash={SECRET_ADMIN_HASH} />
        
        {section === 'dashboard' && (
          <DashboardView
            personas={personas}
            estadisticas={estadisticas}
            loadingEstadisticas={loadingEstadisticas}
            loadingPersonas={loadingPersonas}
            personColumns={personColumns}
            extraExportFields={extraExportFields}
            onView={handleOnView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onSearch={searchPersonas}
            onExport={handleExport}
            onFilter={handleFilter}
            onCreate={handleCreate}
            onRefresh={handleRefresh}
          />
        )}
        
        {section === 'jovenes' && <JovenesView />}
        
        {section === 'clases' && (
          <ClasesView 
            reloadSignal={reload} 
            onReload={() => setReload(r => r + 1)} 
          />
        )}
      </AdminLayout>

      {/* Modales */}
      <ViewPersonModal
        isOpen={modalView === 'view'}
        onClose={closeModal}
        persona={selectedPersona}
      />
      
      <EditPersonModal
        isOpen={modalView === 'edit'}
        onClose={closeModal}
        persona={selectedPersona}
        onSave={handleSaveEdit}
      />
      
      <DeletePersonModal
        isOpen={modalView === 'delete'}
        onClose={closeModal}
        persona={selectedPersona}
        onConfirm={handleConfirmDelete}
      />

      <RestorePersonModal
        isOpen={modalView === 'restore'}
        onClose={closeModal}
        persona={selectedPersona}
        onConfirm={handleConfirmRestore}
      />

      <CreatePersonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}