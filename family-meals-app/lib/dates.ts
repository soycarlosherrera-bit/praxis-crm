/** Lunes de la semana que contiene `d`, en formato YYYY-MM-DD. */
export function getMondayISO(d: Date): string {
  const date = new Date(d)
  const day = date.getDay() // 0=domingo .. 6=sábado
  const diff = (day === 0 ? -6 : 1) - day
  date.setDate(date.getDate() + diff)
  return toISODate(date)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function weekDays(weekStartISO: string): { date: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(weekStartISO, i)
    return { date, label: DAY_LABELS[i] }
  })
}

export function formatShort(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`)
  return d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })
}
