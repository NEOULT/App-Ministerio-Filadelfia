// src/components/Admin/peopleTable/utils/sortUtils.ts
import type { SortDirection, SortMode } from '../types'
import { calcularEdad } from './personUtils'

/**
 * Extrae un valor comparable a partir de una fila y una clave,
 * según el modo de ordenamiento especificado.
 */
export function getRowSortValue<T extends Record<string, unknown>>(
  row: T,
  key: string,
  mode: SortMode
) {
  switch (key) {
    case 'nombreCompleto': {
      const nombre = String((row as Record<string, unknown>).nombre ?? '')
      const apellido = String((row as Record<string, unknown>).apellido ?? '')
      return `${nombre} ${apellido}`.trim()
    }
    case 'cedula': {
      const cedulaValue = Number((row as Record<string, unknown>).cedula)
      return Number.isNaN(cedulaValue) ? null : cedulaValue
    }
    case 'edad': {
      const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
      return calcularEdad(fechaNac)
    }
    case 'fecha_nacimiento': {
      const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
      if (!fechaNac) return null
      const date = new Date(fechaNac)
      if (Number.isNaN(date.getTime())) return null

      if (mode === 'birthMonthDay') {
        return {
          month: date.getMonth(),
          day: date.getDate(),
          year: date.getFullYear(),
          time: date.getTime(),
        }
      }

      return date.getTime()
    }
    default: {
      const value = (row as Record<string, unknown>)[key]
      if (value === null || value === undefined) return null
      if (typeof value === 'boolean') return value ? 1 : 0
      if (typeof value === 'number') return value
      return String(value).toLowerCase()
    }
  }
}

/**
 * Compara dos valores de ordenamiento y devuelve -1, 0 o 1.
 */
export function compareSortValues(
  left: unknown,
  right: unknown,
  direction: SortDirection
) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (left === null || left === undefined)
    return right === null || right === undefined ? 0 : 1 * multiplier
  if (right === null || right === undefined) return -1 * multiplier

  if (
    typeof left === 'object' &&
    typeof right === 'object' &&
    left &&
    right &&
    'month' in left &&
    'month' in right
  ) {
    const leftDate = left as { month: number; day: number; year: number; time: number }
    const rightDate = right as { month: number; day: number; year: number; time: number }
    if (leftDate.month !== rightDate.month)
      return (leftDate.month - rightDate.month) * multiplier
    if (leftDate.day !== rightDate.day)
      return (leftDate.day - rightDate.day) * multiplier
    if (leftDate.year !== rightDate.year)
      return (leftDate.year - rightDate.year) * multiplier
    return (leftDate.time - rightDate.time) * multiplier
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })
  return collator.compare(String(left), String(right)) * multiplier
}
