import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * ScheduleCalendar — reusable mini calendar
 *
 * Props:
 *  selectedDate?: Date
 *  onSelectDate?: (date: Date) => void
 *  highlightDates?: Date[]   — dates with sessions/events (shown with dot)
 *  todayDate?: Date          — defaults to new Date()
 */

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  const prev  = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prev - i, cur: false })
  for (let d = 1; d <= days; d++) cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - days - first + 1, cur: false })
  return cells
}

function isSameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
}

export default function ScheduleCalendar({
  selectedDate,
  onSelectDate,
  highlightDates = [],
  todayDate = new Date(),
}) {
  const [view, setView] = useState({
    year:  todayDate.getFullYear(),
    month: todayDate.getMonth(),
  })

  const cells = buildCalendar(view.year, view.month)

  const prevMonth = () =>
    setView(v => v.month === 0
      ? { year: v.year - 1, month: 11 }
      : { ...v, month: v.month - 1 })

  const nextMonth = () =>
    setView(v => v.month === 11
      ? { year: v.year + 1, month: 0 }
      : { ...v, month: v.month + 1 })

  const hasEvent = (day) =>
    highlightDates.some(d =>
      d.getFullYear() === view.year &&
      d.getMonth()    === view.month &&
      d.getDate()     === day
    )

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .sc-cell {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; cursor: pointer; font-weight: 500;
          transition: background .12s; margin: 0 auto; position: relative;
        }
        .sc-cell:hover { background: #F3F0FF; color: #7C3AED; }
        .sc-cell.today   { background: #7C3AED; color: white; font-weight: 700; }
        .sc-cell.selected:not(.today) { border: 2px solid #7C3AED; color: #7C3AED; font-weight: 700; }
        .sc-cell.other   { color: #D1D5DB; pointer-events: none; }
        .sc-nav-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid #E5E7EB; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .12s;
        }
        .sc-nav-btn:hover { background: #F3F0FF; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>
          {MONTHS[view.month]} {view.year}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="sc-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={12} color="#6B7280" />
          </button>
          <button className="sc-nav-btn" onClick={nextMonth}>
            <ChevronRight size={12} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px 0' }}>
        {cells.map((c, i) => {
          const date    = new Date(view.year, view.month, c.day)
          const isToday = c.cur && isSameDay(date, todayDate)
          const isSel   = c.cur && selectedDate && isSameDay(date, selectedDate)
          const hasDot  = c.cur && hasEvent(c.day)

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                className={[
                  'sc-cell',
                  !c.cur   ? 'other'    : '',
                  isToday  ? 'today'    : '',
                  isSel    ? 'selected' : '',
                ].join(' ')}
                onClick={() => c.cur && onSelectDate?.(date)}
              >
                {c.day}
              </div>
              {hasDot && !isToday && !isSel && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7C3AED', marginTop: 1 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}