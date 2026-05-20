// src/hooks/useStatistics.ts
import { useState, useEffect, useCallback } from 'react'
import { getEstadisticas, type EstadisticasResponse } from '@/services/Api'

export function useStatistics(fechaInicio: string, fechaFin: string) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasResponse>({
    personasConMasDe2Faltas: 0,
    totalAsistentes: 0,
    promedioAsistenciaSemanal: 0,
    promedioAsistenciaMensual: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEstadisticas(fechaInicio, fechaFin)
      setEstadisticas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas])

  return { 
    estadisticas, 
    loading, 
    error, 
    refreshEstadisticas: fetchEstadisticas 
  }
}