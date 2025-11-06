import { useEffect, useState } from 'react'
import ClaseForm from '@/components/ClassForm/ClassForm'
import ClasesList from '@/components/ClassList/ClassList'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, Home } from 'lucide-react'
import PersonaList from '@/components/PersonaList/PersonaList'

export default function Admin() {
  const SECRET_ADMIN_HASH = '#/__sigma-astral-portal__c3d4e2-4f10'
  const [hash, setHash] = useState(window.location.hash)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const getSection = () => {
    if (!hash.startsWith(SECRET_ADMIN_HASH)) return 'jovenes'
    const rest = hash.slice(SECRET_ADMIN_HASH.length) || ''
    const clean = rest.startsWith('/') ? rest.slice(1) : rest
    if (clean.startsWith('clases')) return 'clases'
    if (clean.startsWith('jovenes') || clean.startsWith('personas')) return 'jovenes'
    return 'jovenes'
  }

  const section = getSection()

  return (
    <div style={{ 
      maxWidth: '1200px', 
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#1f2937' }}>
              Panel de Administración
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Gestiona jóvenes y clases de la iglesia
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.hash = '#/'}
          >
            <Home className="h-4 w-4 mr-2" />
            Volver al Inicio
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '24px',
        display: 'flex',
        gap: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <a
          href={`${SECRET_ADMIN_HASH}/jovenes`}
          style={{
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.15s',
            backgroundColor: section === 'jovenes' ? '#dbeafe' : 'transparent',
            color: section === 'jovenes' ? '#1e40af' : '#6b7280'
          }}
          onMouseEnter={(e) => {
            if (section !== 'jovenes') {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }
          }}
          onMouseLeave={(e) => {
            if (section !== 'jovenes') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <Users className="h-4 w-4" />
          Jóvenes
        </a>
        <a
          href={`${SECRET_ADMIN_HASH}/clases`}
          style={{
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.15s',
            backgroundColor: section === 'clases' ? '#dbeafe' : 'transparent',
            color: section === 'clases' ? '#1e40af' : '#6b7280'
          }}
          onMouseEnter={(e) => {
            if (section !== 'clases') {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }
          }}
          onMouseLeave={(e) => {
            if (section !== 'clases') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <GraduationCap className="h-4 w-4" />
          Clases
        </a>
      </nav>

      {/* Content */}
      {section === 'jovenes' && (
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <PersonaList />
        </section>
      )}

      {section === 'clases' && (
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ClaseForm onCreated={() => setReload(r => r + 1)} />
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
            <ClasesList reloadSignal={reload} />
          </div>
        </section>
      )}
    </div>
  )
}
