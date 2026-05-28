// src/components/Admin/peopleTable/utils/excelExport.ts
import ExcelJS from 'exceljs'
import type { Column } from '../types'

/**
 * Paleta de colores corporativos profesional.
 */
const COLORS = {
  primary: '1E40AF',       // Indigo-800
  primaryLight: 'DBEAFE',  // Indigo-100
  accent: 'F59E0B',        // Ámbar-500 (toques de acento)
  white: 'FFFFFF',
  textDark: '1F2937',      // Gray-800
  textMedium: '6B7280',    // Gray-500
  border: 'D1D5DB',        // Gray-300
  stripeEven: 'F9FAFB',    // Gray-50
  stripeOdd: 'FFFFFF',     // White
  titleBg: 'EEF2FF',       // Indigo-50
}

/**
 * Genera y descarga un archivo Excel (.xlsx) profesional con estilos.
 *
 * @param data       - Array de filas con los datos a exportar.
 * @param columns    - Definiciones de columnas (usa `label` como header y `render` para formatear).
 * @param filename   - Nombre del archivo (sin extensión).
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'exportacion'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Ministerio Filadelfia'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Miembros')

  // ─── Configuración de hoja ──────────────────────────────────────
  sheet.properties.defaultRowHeight = 22
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false }

  // ─── Definir estilos reutilizables ──────────────────────────────
  const titleFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 18,
    bold: true,
    color: { argb: COLORS.primary },
  }

  const subtitleFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
    color: { argb: COLORS.textMedium },
  }

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: COLORS.white },
  }

  const dataFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    color: { argb: COLORS.textDark },
  }

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.primary },
  }

  const titleFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.titleBg },
  }

  const borderStyle: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: COLORS.border },
  }

  const border: Partial<ExcelJS.Borders> = {
    top: borderStyle,
    left: borderStyle,
    bottom: borderStyle,
    right: borderStyle,
  }

  // ─── 1. FILA DE TÍTULO (merged) ──────────────────────────────
  const titleRow = sheet.addRow([])
  titleRow.height = 40
  const titleCell = titleRow.getCell(1)
  titleCell.value = 'Ministerio Filadelfia'
  titleCell.font = titleFont
  titleCell.fill = titleFill
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  // Borde sutil inferior al título
  const titleBottomBorder: Partial<ExcelJS.Border> = {
    style: 'medium',
    color: { argb: COLORS.primary },
  }
  titleCell.border = { ...border, bottom: titleBottomBorder }

  // ─── 2. FILA DE SUBTÍTULO (fecha de exportación) ─────────────
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const subtitleRow = sheet.addRow([])
  subtitleRow.height = 20
  const subtitleCell = subtitleRow.getCell(1)
  subtitleCell.value = `Exportado el ${today} · ${data.length} registros`
  subtitleCell.font = subtitleFont
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' }

  // ─── 3. FILA VACÍA (separación) ──────────────────────────────
  sheet.addRow([])

  // ─── 4. FILA DE ENCABEZADOS ──────────────────────────────────
  const headerRow = sheet.addRow(columns.map((col) => col.label))
  headerRow.height = 28

  columns.forEach((_, colIndex) => {
    const cell = headerRow.getCell(colIndex + 1)
    cell.font = headerFont
    cell.fill = headerFill
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = border
  })

  // ─── 5. FILAS DE DATOS ───────────────────────────────────────
  const totalCols = columns.length
  const startDataRow = headerRow.number + 1

  data.forEach((row, rowIndex) => {
    const excelRow = sheet.addRow(
      columns.map((col) => {
        if (col.render) {
          const rendered = col.render(row[col.key], row)
          return reactNodeToExcelValue(rendered)
        }
        const value = row[col.key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'boolean') return value ? 'Sí' : 'No'
        if (value instanceof Date) return value.toLocaleDateString('es-ES')
        // Preservar números para que Excel los reconozca como tal
        if (typeof value === 'number') return value
        // Cédula: si es string numérico largo, mantenerlo como string
        // para evitar notación científica
        if (typeof value === 'string' && /^\d{7,}$/.test(value)) {
          return value
        }
        return String(value)
      })
    )
    excelRow.height = 22

    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      cell.font = dataFont
      cell.border = border

      // Alternar color de fila (zebra striping)
      const isEven = rowIndex % 2 === 0
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.stripeEven : COLORS.stripeOdd },
      }

      // Alineación según el tipo de dato
      const raw = row[col.key]
      if (typeof raw === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    })
  })

  // ─── 6. AUTO-FILTRO ──────────────────────────────────────────
  const lastDataRowNum = startDataRow - 1 + data.length
  const autoFilterRef = `${sheet.getCell(startDataRow - 1, 1).address}:${sheet.getCell(lastDataRowNum, totalCols).address}`
  sheet.autoFilter = autoFilterRef

  // ─── 7. PANEL CONGELADO (freeze header + título) ─────────────
  sheet.views = [
    {
      state: 'frozen',
      ySplit: startDataRow - 1, // Congela título + subtítulo + espacio + header
      xSplit: 0,
      activeCell: `${sheet.getCell(startDataRow, 1).address}`,
    },
  ]

  // ─── 8. ANCHO DE COLUMNAS INTELIGENTE ────────────────────────
  columns.forEach((col, i) => {
    const headerLen = col.label.length
    let maxDataLen = 0
    for (const row of data) {
      let cellValue = ''
      if (col.render) {
        cellValue = reactNodeToExcelValue(col.render(row[col.key], row))
      } else {
        const v = row[col.key]
        cellValue = v == null ? '' : String(v)
      }
      maxDataLen = Math.max(maxDataLen, cellValue.length)
    }
    // Ancho mínimo 12, máximo 55, con margen de 3 caracteres
    const width = Math.min(Math.max(Math.max(headerLen, maxDataLen) + 3, 12), 55)
    sheet.getColumn(i + 1).width = width
  })

  // ─── 9. MERGE DE TÍTULO Y SUBTÍTULO a lo ancho de todas las columnas ──
  const lastColLetter = sheet.getColumn(totalCols).letter
  sheet.mergeCells(`A1:${lastColLetter}1`)
  sheet.mergeCells(`A2:${lastColLetter}2`)

  // ─── 10. GENERAR Y DESCARGAR ─────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convierte un ReactNode a un valor string utilizable en Excel.
 * Maneja strings, números, booleanos y fragmentos simples.
 *
 * NOTA: En React, `{false}` y `{true}` en JSX no renderizan nada.
 * Esta función replica ese comportamiento devolviendo string vacío
 * para valores booleanos.
 */
function reactNodeToExcelValue(node: React.ReactNode): string {
  if (node === null || node === undefined) return ''

  // Strings y números se convierten directamente
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  // En React, booleanos en JSX no renderizan nada (ej: {cond && <span/>})
  // Así que retornamos string vacío en lugar de "true" / "false"
  if (typeof node === 'boolean') return ''

  // Para elementos React, extraemos el texto del children
  if (typeof node === 'object' && 'props' in node) {
    const children = (node as React.ReactElement<{ children?: React.ReactNode }>).props?.children
    if (children !== undefined && children !== null) {
      if (typeof children === 'string') return children
      if (typeof children === 'number') return String(children)
      if (Array.isArray(children)) {
        return children
          .map((child: React.ReactNode) => reactNodeToExcelValue(child))
          .filter(Boolean)
          .join(' ')
      }
      return reactNodeToExcelValue(children as React.ReactNode)
    }
  }

  return ''
}
