// src/utils/dateUtils.ts
export function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  // Formato YYYY-MM-DD
  const from = startOfMonth.toISOString().split('T')[0]
  const to = endOfMonth.toISOString().split('T')[0]
  
  return { from, to }
}

// También puedes crear funciones para meses anteriores si lo necesitas
export function getPreviousMonthRange() {
  const now = new Date()
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  
  const from = startOfPrevMonth.toISOString().split('T')[0]
  const to = endOfPrevMonth.toISOString().split('T')[0]
  
  return { from, to }
}