// src/Pages/Admin.tsx
import { useEffect, useState } from 'react'
import { type Persona } from '@/components/Admin/peopleTable/peopleTable'
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
  
  // Estados para modales
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [modalView, setModalView] = useState<'view' | 'edit' | 'delete' | null>(null)
  
  // Obtener rango del mes actual
  const { from, to } = getCurrentMonthRange()
  
  // Hooks para datos
  const {
    personas,
    loading: loadingPersonas,
    searchPersonas,
    refreshPersonas
  } = usePersonas()
  
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
      key: 'ministerio', 
      label: 'Ministerio', 
      align: 'center',
      render: (value) => (value as string) || '-'
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

  const handleSaveEdit = async (updatedData: Partial<Persona>) => {
    try {
      // Aquí llamas a tu API para actualizar
      console.log('Guardando cambios:', updatedData)
      // await updatePersona(selectedPersona?._id, updatedData)
      
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
      // Aquí llamas a tu API para eliminar
      console.log('Eliminando:', selectedPersona)
      // await deletePersona(selectedPersona?._id)
      
      // Recargar datos después de eliminar
      await refreshPersonas()
      await refreshEstadisticas()
    } catch (error) {
      console.error('Error al eliminar:', error)
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

  const handleFilter = () => {
    console.log('Abrir filtros')
  }

  const handleCreate = () => {
    console.log('Crear nuevo registro')
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
            onView={handleOnView}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
    </>
  )
}