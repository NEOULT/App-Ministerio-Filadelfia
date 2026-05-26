// components/PeopleTable/PeopleTable.tsx
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit2, Trash2, RotateCcw, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';
import './PeopleTable.css';
import FilterDropdown, { DEFAULT_FILTERS, type FiltersState } from './FilterDropdown';
import { calcularEdad, getBirthMonthFromFechaNacimiento } from './utils/personUtils';

// Tipos específicos para las columnas
export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Column<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: ColumnAlignment;
}

type SortDirection = 'asc' | 'desc';

type SortMode = 'default' | 'birthMonthDay';

interface SortState {
  key: string | null;
  direction: SortDirection;
  mode: SortMode;
}

const FLOATING_MENU_GAP = 8;
const SORT_MENU_ESTIMATED_SIZE = { width: 240, height: 96 };
const EXPORT_MENU_ESTIMATED_SIZE = { width: 220, height: 88 };

function getFloatingMenuStyles(
  triggerRect: DOMRect,
  menuSize: { width: number; height: number },
  alignRight = false
): React.CSSProperties {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const top = Math.min(
    viewportHeight - menuSize.height - FLOATING_MENU_GAP,
    Math.max(FLOATING_MENU_GAP, triggerRect.bottom + FLOATING_MENU_GAP)
  )

  const left = alignRight
    ? Math.min(
        viewportWidth - menuSize.width - FLOATING_MENU_GAP,
        Math.max(FLOATING_MENU_GAP, triggerRect.right - menuSize.width)
      )
    : Math.min(
        viewportWidth - menuSize.width - FLOATING_MENU_GAP,
        Math.max(FLOATING_MENU_GAP, triggerRect.left)
      )

  return { position: 'fixed', top, left, zIndex: 1000 }
}

function getRowSortValue<T extends Record<string, unknown>>(row: T, key: string, mode: SortMode) {
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
          time: date.getTime()
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

function compareSortValues(left: unknown, right: unknown, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (left === null || left === undefined) return right === null || right === undefined ? 0 : 1 * multiplier
  if (right === null || right === undefined) return -1 * multiplier

  if (typeof left === 'object' && typeof right === 'object' && left && right && 'month' in left && 'month' in right) {
    const leftDate = left as { month: number; day: number; year: number; time: number }
    const rightDate = right as { month: number; day: number; year: number; time: number }
    if (leftDate.month !== rightDate.month) return (leftDate.month - rightDate.month) * multiplier
    if (leftDate.day !== rightDate.day) return (leftDate.day - rightDate.day) * multiplier
    if (leftDate.year !== rightDate.year) return (leftDate.year - rightDate.year) * multiplier
    return (leftDate.time - rightDate.time) * multiplier
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })
  return collator.compare(String(left), String(right)) * multiplier
}

function generateBirthdayHTML<T extends Record<string, unknown>>(data: T[]): string {
  const getNombreCompleto = (row: T): string => {
    const nombre = String((row as Record<string, unknown>).nombre ?? '')
    const apellido = String((row as Record<string, unknown>).apellido ?? '')
    return `${nombre} ${apellido}`.trim()
  }

  const getTelefono = (row: T): string => {
    return String((row as Record<string, unknown>).telefono ?? '-')
  }

  const getFechaFormateada = (row: T): string => {
    const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
    if (!fechaNac) return '-'
    const [fechaParte] = fechaNac.split('T')
    const [year, month, day] = fechaParte.split('-')
    return `${day}/${month}/${year}`
  }

  const getFechaNacimiento = (row: T): Date | null => {
    const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
    if (!fechaNac) return null
    const date = new Date(fechaNac)
    return isNaN(date.getTime()) ? null : date
  }

  // Group by month
  const groupedByMonth = new Map<number, T[]>()
  for (let i = 0; i < 12; i++) {
    groupedByMonth.set(i, [])
  }

  data.forEach(row => {
    const date = getFechaNacimiento(row)
    if (date) {
      const month = date.getMonth()
      groupedByMonth.get(month)?.push(row)
    }
  })

  // Filter out empty months, sort chronologically
  const nonEmptyMonths = Array.from(groupedByMonth.entries())
    .filter(([_, rows]) => rows.length > 0)
    .sort(([a], [b]) => a - b)

  const monthsSpanish = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const monthEmojis: Record<string, string> = {
    'Enero': '❄️', 'Febrero': '🌸', 'Marzo': '🌸', 'Abril': '🌸',
    'Mayo': '🌸', 'Junio': '🌼', 'Julio': '☀️', 'Agosto': '☀️',
    'Septiembre': '🍂', 'Octubre': '🍂', 'Noviembre': '🍂', 'Diciembre': '❄️'
  }

  const monthNamesUpper: Record<string, string> = {
    'Enero': 'ENERO', 'Febrero': 'FEBRERO', 'Marzo': 'MARZO', 'Abril': 'ABRIL',
    'Mayo': 'MAYO', 'Junio': 'JUNIO', 'Julio': 'JULIO', 'Agosto': 'AGOSTO',
    'Septiembre': 'SEPTIEMBRE', 'Octubre': 'OCTUBRE', 'Noviembre': 'NOVIEMBRE', 'Diciembre': 'DICIEMBRE'
  }

  let tableRows = ''
  let globalIndex = 1

  nonEmptyMonths.forEach(([monthIdx, rows]) => {
    const monthName = monthsSpanish[monthIdx]
    tableRows += `
            <tr class="section-header">
              <td colspan="4"><span class="month-emoji">${monthEmojis[monthName]}</span>${monthNamesUpper[monthName]}</td>
            </tr>`

    rows.forEach(row => {
      tableRows += `
            <tr>
              <td>${globalIndex++}</td>
              <td>${getNombreCompleto(row)}</td>
              <td>${getTelefono(row)}</td>
              <td>${getFechaFormateada(row)}</td>
            </tr>`
    })
  })

  const today = new Date()
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cumpleaños</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #814BE7;
      --primary-light: #C17BFD;
      --bg: #F7F7F7;
      --card-bg: #FFFFFF;
      --text: #1F1F24;
      --text-muted: #6E7191;
      --border: #E2E4ED;
      --radius: 12px;
      --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.05);
      --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.10);
      --font: 'Open Sans', system-ui, -apple-system, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root:not(.light) {
        --bg: #1E2235;
        --card-bg: #2D3148;
        --text: #E2E4ED;
        --text-muted: #A2A7BD;
        --border: #484D66;
        --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.15);
        --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.25);
      }
    }
    :root.dark {
      --bg: #1E2235;
      --card-bg: #2D3148;
      --text: #E2E4ED;
      --text-muted: #A2A7BD;
      --border: #484D66;
      --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.15);
      --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.25);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 24px;
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60vh;
      background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,108,249,0.06), transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.2;
      background: linear-gradient(135deg, var(--text) 0%, var(--primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .table-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow-x: auto;
    }
    .table-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-hover);
    }
    .table-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary-light), transparent);
      opacity: 0.6;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 20px;
    }
    .table-card table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .table-card th {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 2px solid var(--border);
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
    }
    .table-card td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    .table-card tr:last-child td {
      border-bottom: none;
    }
    .table-card tbody tr:nth-child(even) td {
      background: rgba(91,108,249,0.02);
    }
    .table-card tbody tr:hover td {
      background: rgba(91,108,249,0.06);
    }
    .section-header td {
      background: linear-gradient(90deg, var(--primary), var(--primary-light));
      color: white;
      font-weight: 600;
      text-align: center;
      padding: 8px;
      border-bottom: none !important;
    }
    .month-emoji {
      font-size: 1.1rem;
      margin-right: 6px;
    }
    .theme-toggle {
      position: absolute;
      top: 24px;
      right: 0;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1;
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .theme-toggle:hover { color: var(--text); border-color: var(--primary-light); }
    .theme-toggle .icon-sun,
    .theme-toggle .icon-moon { display: none; }
    .theme-toggle .icon-sun { display: inline; }
    :root.dark .theme-toggle .icon-sun { display: none; }
    :root.dark .theme-toggle .icon-moon { display: inline; }
    @media (prefers-color-scheme: dark) {
      :root:not(.light) .theme-toggle .icon-sun { display: none; }
      :root:not(.light) .theme-toggle .icon-moon { display: inline; }
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    @media (max-width: 768px) {
      body { padding: 16px; }
      .title { font-size: 1.35rem; }
      .table-card { padding: 16px; }
      .table-card table { font-size: 0.8rem; }
      .table-card th, .table-card td { padding: 8px 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Cambiar modo oscuro">
        <span class="icon-sun">☀️</span>
        <span class="icon-moon">🌙</span>
      </button>
      <div>
        <h1 class="title">🎂 Cumpleaños</h1>
        <p class="subtitle" id="total-personas">Total: ${data.length} personas</p>
      </div>
    </header>
    <div class="table-card">
      <div class="card-title">Lista de Cumpleaños</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre Completo</th>
            <th>Teléfono</th>
            <th>Fecha de Nacimiento</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <footer class="footer">
      <span>Ministerio Filadelfia — Juventud</span>
    </footer>
  </div>
  <script>
    function toggleTheme() {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark') || 
                     (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.remove('dark', 'light');
      root.classList.add(isDark ? 'light' : 'dark');
    }
  </script>
</body>
</html>`
}

// Props del componente con tipos genéricos
export interface PeopleTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onSearch?: (searchTerm: string) => void;
  onExport?: () => void;
  onFilter?: (filters: FiltersState) => void;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  onView?: (row: T) => void;
  itemsPerPage?: number;
  showActions?: boolean;
  loading?: boolean;
}

// Componente de menú de acciones
interface ActionMenuProps<T> {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  deletedView?: boolean;
}

// ActionMenu component actualizado
function ActionMenu<T>({ row, onView, onEdit, onDelete, onRestore, deletedView = false }: ActionMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({});
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) {
      setIsPositioned(false);
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    const openAbove = triggerRect.bottom + dropdownRect.height + gap > viewportHeight && triggerRect.top > dropdownRect.height + gap;
    const top = openAbove
      ? Math.max(gap, triggerRect.top - dropdownRect.height - gap)
      : Math.min(viewportHeight - dropdownRect.height - gap, triggerRect.bottom + gap);

    const openToLeft = triggerRect.left + dropdownRect.width > viewportWidth - gap;
    const left = openToLeft
      ? Math.max(gap, triggerRect.right - dropdownRect.width)
      : Math.min(viewportWidth - dropdownRect.width - gap, triggerRect.left);

    setMenuStyles({
      position: 'fixed',
      top,
      left,
      zIndex: 1000,
    });
    setIsPositioned(true);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="action-menu-container" ref={triggerRef}>
      <button
        className="action-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="action-menu-dropdown"
          style={{
            ...menuStyles,
            visibility: isPositioned ? 'visible' : 'hidden',
          }}
        >
          {onView && (
            <button
              className="action-menu-item"
              onClick={() => handleAction(() => onView(row))}
              type="button"
            >
              <Eye size={16} />
              <span>Ver</span>
            </button>
          )}
          {onEdit && (
            <button
              className="action-menu-item"
              onClick={() => handleAction(() => onEdit(row))}
              type="button"
            >
              <Edit2 size={16} />
              <span>Editar</span>
            </button>
          )}
          {deletedView && onRestore ? (
            <button
              className="action-menu-item restore-item"
              onClick={() => handleAction(() => onRestore(row))}
              type="button"
            >
              <RotateCcw size={16} />
              <span>Restaurar</span>
            </button>
          ) : onDelete && (
            <button
              className="action-menu-item delete-item"
              onClick={() => handleAction(() => onDelete(row))}
              type="button"
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export interface Persona extends Record<string, unknown> {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: number;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  bautizado?: boolean;
  genero?: string;
  ministerio?: string;
  nivel_academico?: string;
  ocupacion?: string;
  direccion?: string;
  imagen_url?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  __v?: number;
  faltas?: number;
  [key: string]: unknown;
}

function PeopleTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  onSearch,
  onExport,
  onFilter,
  onCreate,
  onEdit,
  onDelete,
  onRestore,
  onView,
  itemsPerPage = 10,
  showActions = true,
  loading = false
}: PeopleTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: 'asc', mode: 'default' });
  const sortMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortMenuStyles, setSortMenuStyles] = useState<React.CSSProperties>({});
  const [isSortMenuPositioned, setIsSortMenuPositioned] = useState(false);

  // Export dropdown state
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportMenuStyles, setExportMenuStyles] = useState<React.CSSProperties>({});
  const [isExportMenuPositioned, setIsExportMenuPositioned] = useState(false);

  // Calcular cuántos filtros activos hay
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.cedula) count++
    if (appliedFilters.edadExacta) count++
    if (appliedFilters.edadMin || appliedFilters.edadMax) count++
    if (appliedFilters.mesesNacimiento.length) count++
    if (appliedFilters.bautizado) count++
    if (appliedFilters.genero) count++
    if (appliedFilters.deletedOnly) count++
    if (appliedFilters.faltasMin) count++
    return count
  }, [appliedFilters])

  // Filtrar datos según búsqueda + filtros estructurados
  const filteredData = useMemo(() => {
    let result = data

    // Filtro por búsqueda de texto (soporta múltiples palabras)
    const trimmed = searchTerm.trim()
    if (trimmed) {
      const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter(row => {
        const values = Object.values(row).filter(v => v != null).map(v => String(v).toLowerCase())
        return words.every(word =>
          values.some(val => val.includes(word))
        )
      })
    }

    // Filtros estructurados
    const f = appliedFilters

    if (f.cedula) {
      const term = f.cedula.toLowerCase()
      result = result.filter(row => {
        const val = String((row as Record<string, unknown>).cedula ?? '')
        return val.toLowerCase().includes(term)
      })
    }

    if (f.edadExacta) {
      const edadTarget = parseInt(f.edadExacta, 10)
      if (!isNaN(edadTarget)) {
        result = result.filter(row => {
          const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
          const edad = calcularEdad(fechaNac)
          return edad !== null && edad === edadTarget
        })
      }
    }

    if (f.edadMin || f.edadMax) {
      const min = f.edadMin ? parseInt(f.edadMin, 10) : 0
      const max = f.edadMax ? parseInt(f.edadMax, 10) : Infinity
      if (!isNaN(min) && !isNaN(max)) {
        result = result.filter(row => {
          const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
          const edad = calcularEdad(fechaNac)
          return edad !== null && edad >= min && edad <= max
        })
      }
    }

    if (f.mesesNacimiento.length) {
      result = result.filter(row => {
        const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
        const month = getBirthMonthFromFechaNacimiento(fechaNac)
        return month !== null && f.mesesNacimiento.includes(String(month))
      })
    }

    if (f.bautizado) {
      const buscandoSi = f.bautizado === 'si'
      result = result.filter(row => {
        const val = (row as Record<string, unknown>).bautizado
        return val === buscandoSi
      })
    }

    if (f.genero) {
      result = result.filter(row => {
        const val = (row as Record<string, unknown>).genero
        return val === f.genero
      })
    }

    if (f.deletedOnly) {
      result = result.filter(row => Boolean((row as Record<string, unknown>).isDeleted))
    }

    if (f.faltasMin) {
      const faltasMin = parseInt(f.faltasMin, 10)
      if (!isNaN(faltasMin)) {
        result = result.filter(row => {
          const faltas = (row as Record<string, unknown>).faltas as number | undefined
          return faltas !== undefined && faltas !== null && faltas >= faltasMin
        })
      }
    }

    return result
  }, [data, searchTerm, appliedFilters]);

  const sortedData = useMemo(() => {
    if (!sortState.key) return filteredData

    const rows = [...filteredData]
    rows.sort((leftRow, rightRow) => {
      const leftValue = getRowSortValue(leftRow, sortState.key as string, sortState.mode)
      const rightValue = getRowSortValue(rightRow, sortState.key as string, sortState.mode)
      return compareSortValues(leftValue, rightValue, sortState.direction)
    })
    return rows
  }, [filteredData, sortState])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);

  useLayoutEffect(() => {
    if (!isSortMenuOpen || !sortMenuButtonRef.current || !sortMenuRef.current) {
      setIsSortMenuPositioned(false)
      return
    }

    const buttonRect = sortMenuButtonRef.current.getBoundingClientRect()
    const menuRect = sortMenuRef.current.getBoundingClientRect()
    setSortMenuStyles(getFloatingMenuStyles(buttonRect, menuRect, true))
    setIsSortMenuPositioned(true)
  }, [isSortMenuOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        sortMenuButtonRef.current &&
        !sortMenuButtonRef.current.contains(target) &&
        sortMenuRef.current &&
        !sortMenuRef.current.contains(target)
      ) {
        setIsSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Export dropdown positioning
  useLayoutEffect(() => {
    if (!isExportOpen || !exportButtonRef.current || !exportMenuRef.current) {
      setIsExportMenuPositioned(false)
      return
    }

    const buttonRect = exportButtonRef.current.getBoundingClientRect()
    const menuRect = exportMenuRef.current.getBoundingClientRect()
    setExportMenuStyles(getFloatingMenuStyles(buttonRect, menuRect, false))
    setIsExportMenuPositioned(true)
  }, [isExportOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        exportButtonRef.current &&
        !exportButtonRef.current.contains(target) &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target)
      ) {
        setIsExportOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const setSorting = (key: string, direction: SortDirection, mode: SortMode = 'default') => {
    setSortState({ key, direction, mode })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const toggleSorting = (key: string) => {
    setSortState(prev => {
      const nextDirection: SortDirection = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction: nextDirection, mode: key === 'fecha_nacimiento' ? prev.mode : 'default' }
    })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const handleExportBirthday = () => {
    const html = generateBirthdayHTML(sortedData)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cumpleanios.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsExportOpen(false)
  }

  const handleSortMenuToggle = () => {
    if (isSortMenuOpen) {
      setIsSortMenuPositioned(false)
      setIsSortMenuOpen(false)
      return
    }

    if (sortMenuButtonRef.current) {
      setSortMenuStyles(getFloatingMenuStyles(sortMenuButtonRef.current.getBoundingClientRect(), SORT_MENU_ESTIMATED_SIZE, true))
      setIsSortMenuPositioned(true)
    }

    setIsSortMenuOpen(true)
  }

  const handleExportMenuToggle = () => {
    if (isExportOpen) {
      setIsExportMenuPositioned(false)
      setIsExportOpen(false)
      return
    }

    if (exportButtonRef.current) {
      setExportMenuStyles(getFloatingMenuStyles(exportButtonRef.current.getBoundingClientRect(), EXPORT_MENU_ESTIMATED_SIZE, false))
      setIsExportMenuPositioned(true)
    }

    setIsExportOpen(true)
  }

  const clearSorting = (event: React.MouseEvent) => {
    event.stopPropagation()
    setSortState({ key: null, direction: 'asc', mode: 'default' })
    setCurrentPage(1)
  }

  const getSortLabel = (key: string) => {
    if (sortState.key !== key) return null
    if (key === 'fecha_nacimiento') {
      return sortState.mode === 'birthMonthDay' ? 'Mes y día' : 'Fecha'
    }
    return sortState.direction === 'asc' ? 'Ascendente' : 'Descendente'
  }

  const renderSortIcon = (key: string) => {
    if (sortState.key !== key) return <ArrowUpDown size={14} />
    return sortState.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    onSearch?.(value);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    
    const value = row[column.key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value instanceof Date) return value.toLocaleDateString('es-ES');
    return String(value);
  };

  return (
    <div className="people-table-container">
      {/* Header Section */}
      <div className="people-table-header">
        <h2 className="people-table-title">{title}</h2>
        
        <div className="people-table-actions">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          
          <div className="export-dropdown-container" ref={exportButtonRef}>
            <button 
              onClick={handleExportMenuToggle} 
              className="action-btn export-btn"
              type="button"
            >
              <Download size={18} />
              <span>Exportar</span>
            </button>

            {isExportOpen && createPortal(
              <div
                ref={exportMenuRef}
                className="export-dropdown-menu"
                style={{ ...exportMenuStyles, visibility: isExportMenuPositioned ? 'visible' : 'hidden' }}
              >
                <div className="export-dropdown-header">
                  Elige el formato
                </div>
                <button
                  type="button"
                  className="export-dropdown-item"
                  onClick={handleExportBirthday}
                >
                  <span className="export-dropdown-icon">🎂</span>
                  <span>Cumpleaños</span>
                </button>
              </div>,
              document.body
            )}
          </div>
          
          <FilterDropdown
            filters={filters}
            onChange={setFilters}
            onApply={() => {
              setAppliedFilters({ ...filters })
              onFilter?.({ ...filters })
              setCurrentPage(1)
            }}
            onClear={() => {
              setFilters({ ...DEFAULT_FILTERS })
              setAppliedFilters({ ...DEFAULT_FILTERS })
              onFilter?.({ ...DEFAULT_FILTERS })
              setCurrentPage(1)
            }}
            activeCount={activeFilterCount}
          />
          
          <button 
            onClick={onCreate} 
            className="action-btn create-btn"
            type="button"
          >
            <Plus size={18} />
            <span>Crear Registro</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <table className="people-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`table-header ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 
                      'text-left'
                    } ${sortState.key === String(column.key) ? 'sorted-column' : ''}`}
                    aria-sort={sortState.key === String(column.key) ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="table-header-content">
                      <button
                        type="button"
                        className="table-header-sort-btn"
                        onClick={() => toggleSorting(String(column.key))}
                      >
                        <span>{column.label}</span>
                        <span className="sort-icon">{renderSortIcon(String(column.key))}</span>
                      </button>

                      {String(column.key) === 'fecha_nacimiento' && (
                        <button
                          ref={sortMenuButtonRef}
                          type="button"
                          className="table-header-menu-btn"
                          onClick={handleSortMenuToggle}
                          aria-label="Mostrar opciones de ordenamiento"
                        >
                          <ChevronDown size={14} />
                        </button>
                      )}

                      {sortState.key === String(column.key) && (
                        <span className="sort-badge">
                          {getSortLabel(String(column.key))}
                          <button
                            type="button"
                            className="sort-clear-btn"
                            onClick={clearSorting}
                            aria-label="Limpiar ordenamiento"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {showActions && (
                  <th className="table-header actions-header sticky-actions">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            {isSortMenuOpen && createPortal(
              <div
                ref={sortMenuRef}
                className="sort-dropdown-menu"
                style={{ ...sortMenuStyles, visibility: isSortMenuPositioned ? 'visible' : 'hidden' }}
              >
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'asc', 'birthMonthDay')}
                >
                  <span className={sortState.key === 'fecha_nacimiento' && sortState.mode === 'birthMonthDay' ? 'sort-dropdown-check' : 'sort-dropdown-check-empty'}>
                    {sortState.key === 'fecha_nacimiento' && sortState.mode === 'birthMonthDay' ? '✓' : ''}
                  </span>
                  Mes y día de nacimiento
                </button>
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'asc', 'default')}
                >
                  <span className={sortState.key === 'fecha_nacimiento' && sortState.mode === 'default' ? 'sort-dropdown-check' : 'sort-dropdown-check-empty'}>
                    {sortState.key === 'fecha_nacimiento' && sortState.mode === 'default' ? '✓' : ''}
                  </span>
                  Fecha más antiguo
                </button>
              </div>,
              document.body
            )}
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={index} className="table-row">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`table-cell ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 
                          'text-left'
                        }`}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                    {showActions && (
                      <td className="table-cell actions-cell sticky-actions">
                        <ActionMenu
                          row={row}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onRestore={onRestore}
                          deletedView={appliedFilters.deletedOnly}
                        />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="empty-state"
                  >
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="pagination-footer">
          <div className="pagination-info">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} de{' '}
            {filteredData.length} registros
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-nav"
              type="button"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
            
            <div className="pagination-pages">
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-nav"
              type="button"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PeopleTable;