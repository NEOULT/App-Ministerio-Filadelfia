// src/hooks/usePersonas.ts
import { useState, useEffect, useCallback } from 'react'
import { getPersonas, type Persona as ApiPersona } from '../services/Api'
import type { Persona as TablePersona } from '@/components/Admin/peopleTable/types'

export function usePersonas(deletedOnly = false) {
  const [personas, setPersonas] = useState<TablePersona[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPersonas, setFilteredPersonas] = useState<TablePersona[]>([])

  const normalizePersona = useCallback((persona: ApiPersona): TablePersona => {
    const raw = persona as unknown as Record<string, unknown>
    const nombreCompleto = typeof raw.nombreCompleto === 'string' ? raw.nombreCompleto : ''
    const [nombre = '', ...apellidoParts] = nombreCompleto.split(' ')
    const apellido = apellidoParts.join(' ').trim()

    return {
      _id: String(raw._id ?? ''),
      nombre: typeof raw.nombre === 'string' ? raw.nombre : nombre,
      apellido: typeof raw.apellido === 'string' ? raw.apellido : apellido,
      cedula: Number(raw.cedula ?? 0),
      email: typeof raw.email === 'string' ? raw.email : undefined,
      telefono: typeof raw.telefono === 'string' ? raw.telefono : undefined,
      fecha_nacimiento: typeof raw.fecha_nacimiento === 'string'
        ? raw.fecha_nacimiento
        : (typeof raw.fechaNacimiento === 'string' ? raw.fechaNacimiento : undefined),
      direccion: typeof raw.direccion === 'string' ? raw.direccion : undefined,
      bautizado: typeof raw.bautizado === 'boolean' ? raw.bautizado : undefined,
      genero: typeof raw.genero === 'string' ? raw.genero : undefined,
      ministerio: typeof raw.ministerio === 'string' ? raw.ministerio : undefined,
      nivel_academico: typeof raw.nivel_academico === 'string' ? raw.nivel_academico : undefined,
      ocupacion: typeof raw.ocupacion === 'string' ? raw.ocupacion : undefined,
      imagen_url: typeof raw.imagen_url === 'string' ? raw.imagen_url : undefined,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
      isDeleted: typeof raw.isDeleted === 'boolean' ? raw.isDeleted : undefined,
      deletedAt: typeof raw.deletedAt === 'string' || raw.deletedAt === null ? (raw.deletedAt as string | null) : undefined,
      __v: typeof raw.__v === 'number' ? raw.__v : undefined,
      faltas: typeof raw.faltas === 'number' ? raw.faltas : undefined,
    }
  }, [])

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getPersonas({ paginado: false, deletedOnly })
      const normalized = response.data.map(normalizePersona)
      setPersonas(normalized)
      setFilteredPersonas(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas')
      console.error('Error fetching personas:', err)
    } finally {
      setLoading(false)
    }
  }, [deletedOnly, normalizePersona])

  // Filtrar personas por búsqueda (soporta múltiples palabras)
  useEffect(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setFilteredPersonas(personas)
      return
    }

    // Dividir en palabras individuales
    const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean)

    const filtered = personas.filter(persona => {
      // Construir string de búsqueda con todos los campos relevantes
      const p = persona as Record<string, unknown>
      const nombre = String(p.nombre ?? '')
      const apellido = String(p.apellido ?? '')
      const searchable = [
        `${nombre} ${apellido}`,
        String(persona.cedula ?? ''),
        persona.email ?? '',
        persona.telefono ?? ''
      ].join(' ').toLowerCase()

      // Cada palabra debe aparecer en al menos un campo
      return words.every(word => searchable.includes(word))
    })
    setFilteredPersonas(filtered)
  }, [searchTerm, personas])

  const searchPersonas = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  const refreshPersonas = useCallback(() => {
    fetchPersonas()
  }, [fetchPersonas])

  useEffect(() => {
    fetchPersonas()
  }, [fetchPersonas])

  return {
    personas: filteredPersonas,
    allPersonas: personas,
    loading,
    error,
    searchTerm,
    searchPersonas,
    clearSearch,
    refreshPersonas,
  }
}