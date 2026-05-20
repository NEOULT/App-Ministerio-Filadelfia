// src/hooks/usePersonas.ts
import { useState, useEffect, useCallback } from 'react'
import { getPersonas, type Persona } from '../services/Api'

export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getPersonas({ paginado: false }) // Traer todo para búsqueda local
      setPersonas(response.data)
      setFilteredPersonas(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas')
      console.error('Error fetching personas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrar personas por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPersonas(personas)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = personas.filter(persona => {
      const nombreCompleto = `${persona.nombreCompleto}`.toLowerCase()
      const cedulaStr = persona.cedula?.toString() || '' // Convertir número a string
      
      return nombreCompleto.includes(term) ||
        cedulaStr.includes(term) ||
        persona.email?.toLowerCase().includes(term) ||
        persona.telefono?.includes(term)
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