// src/components/Admin/peopleTable/types.ts
import type { FiltersState } from './FilterDropdown'

export type ColumnAlignment = 'left' | 'center' | 'right'

export interface Column<T = Record<string, unknown>> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  align?: ColumnAlignment
}

export type SortDirection = 'asc' | 'desc'

export type SortMode = 'default' | 'birthMonthDay'

export interface SortState {
  key: string | null
  direction: SortDirection
  mode: SortMode
}

export interface Persona extends Record<string, unknown> {
  _id: string
  nombre: string
  apellido: string
  cedula: number
  email?: string
  telefono?: string
  fecha_nacimiento?: string
  bautizado?: boolean
  genero?: string
  ministerio?: string
  nivel_academico?: string
  ocupacion?: string
  direccion?: string
  imagen_url?: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
  deletedAt?: string | null
  __v?: number
  faltas?: number
  [key: string]: unknown
}

export interface ActionMenuProps<T> {
  row: T
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRestore?: (row: T) => void
  deletedView?: boolean
}

export interface PeopleTableProps<T extends Record<string, unknown>> {
  title: string
  data: T[]
  columns: Column<T>[]
  onSearch?: (searchTerm: string) => void
  onExport?: () => void
  onFilter?: (filters: FiltersState) => void
  onCreate?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRestore?: (row: T) => void
  onView?: (row: T) => void
  itemsPerPage?: number
  showActions?: boolean
  loading?: boolean
}
