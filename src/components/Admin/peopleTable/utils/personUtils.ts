// src/utils/personaUtils.ts
import { type Persona } from '@/components/Admin/peopleTable/peopleTable'

export function getNombreCompleto(persona: Persona): string {
  return `${persona.nombre} ${persona.apellido}`.trim()
}

export function calcularEdad(fechaNacimiento?: string): number | null {
  if (!fechaNacimiento) return null
  
  const birthDate = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export function getBirthMonthFromFechaNacimiento(fechaNacimiento?: string): number | null {
  if (!fechaNacimiento) return null

  const [fechaParte] = fechaNacimiento.split('T')
  const [, month] = fechaParte.split('-')
  const parsedMonth = Number.parseInt(month, 10)

  return Number.isNaN(parsedMonth) ? null : parsedMonth
}

export function formatearTelefono(telefono?: string): string {
  return telefono || '-'
}

export function formatearGenero(genero?: string): string {
  if (genero === 'M') return 'Masculino'
  if (genero === 'F') return 'Femenino'
  return '-'
}

export function formatearFecha(fechaIso?: string): string {
  if (!fechaIso) return '-'
  
  // Extraer año, mes, día directamente del string ISO
  const [fechaParte] = fechaIso.split('T')
  const [year, month, day] = fechaParte.split('-')
  
  return `${day}/${month}/${year}`
}

export function formatearBautizado(bautizado?: boolean): string {
  return bautizado ? 'Sí' : 'No'
}