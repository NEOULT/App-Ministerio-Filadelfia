// src/components/Admin/peopleTable/utils/birthdayExport.ts

function getNombreCompleto(row: Record<string, unknown>): string {
  const nombre = String(row.nombre ?? '')
  const apellido = String(row.apellido ?? '')
  return `${nombre} ${apellido}`.trim()
}

function getTelefono(row: Record<string, unknown>): string {
  return String(row.telefono ?? '-')
}

function getFechaFormateada(row: Record<string, unknown>): string {
  const fechaNac = row.fecha_nacimiento as string | undefined
  if (!fechaNac) return '-'
  const [fechaParte] = fechaNac.split('T')
  const [year, month, day] = fechaParte.split('-')
  return `${day}/${month}/${year}`
}

function getFechaNacimientoDate(row: Record<string, unknown>): Date | null {
  const fechaNac = row.fecha_nacimiento as string | undefined
  if (!fechaNac) return null
  const date = new Date(fechaNac)
  return Number.isNaN(date.getTime()) ? null : date
}

const MONTHS_SPANISH = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_EMOJIS: Record<string, string> = {
  Enero: '❄️', Febrero: '🌸', Marzo: '🌸', Abril: '🌸',
  Mayo: '🌸', Junio: '🌼', Julio: '☀️', Agosto: '☀️',
  Septiembre: '🍂', Octubre: '🍂', Noviembre: '🍂', Diciembre: '❄️',
}

const MONTH_NAMES_UPPER: Record<string, string> = {
  Enero: 'ENERO', Febrero: 'FEBRERO', Marzo: 'MARZO', Abril: 'ABRIL',
  Mayo: 'MAYO', Junio: 'JUNIO', Julio: 'JULIO', Agosto: 'AGOSTO',
  Septiembre: 'SEPTIEMBRE', Octubre: 'OCTUBRE', Noviembre: 'NOVIEMBRE', Diciembre: 'DICIEMBRE',
}

export function generateBirthdayHTML(data: Record<string, unknown>[]): string {
  // Group by month
  const groupedByMonth = new Map<number, Record<string, unknown>[]>()
  for (let i = 0; i < 12; i++) {
    groupedByMonth.set(i, [])
  }

  data.forEach((row) => {
    const date = getFechaNacimientoDate(row)
    if (date) {
      const month = date.getMonth()
      groupedByMonth.get(month)?.push(row)
    }
  })

  // Filter out empty months, sort chronologically
  const nonEmptyMonths = Array.from(groupedByMonth.entries())
    .filter(([_, rows]) => rows.length > 0)
    .sort(([a], [b]) => a - b)

  let tableRows = ''
  let globalIndex = 1

  nonEmptyMonths.forEach(([monthIdx, rows]) => {
    const monthName = MONTHS_SPANISH[monthIdx]
    tableRows += `
            <tr class="section-header">
              <td colspan="4"><span class="month-emoji">${MONTH_EMOJIS[monthName]}</span>${MONTH_NAMES_UPPER[monthName]}</td>
            </tr>`

    rows.forEach((row) => {
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

  return buildHTMLTemplate(tableRows, data.length, dateStr)
}

function buildHTMLTemplate(
  tableRows: string,
  totalPersonas: number,
  _dateStr: string
): string {
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
        <p class="subtitle" id="total-personas">Total: ${totalPersonas} personas</p>
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
