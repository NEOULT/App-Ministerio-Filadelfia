
"use client"

import * as React from "react"
import { DatePicker as AntDatePicker } from "antd"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import "dayjs/locale/es"
import esES from "antd/locale/es_ES"

dayjs.locale("es")

interface DatePickerProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  rightSlot?: React.ReactNode
}

export const DatePicker = ({ selected, onSelect, rightSlot }: DatePickerProps) => {
  const dayjsValue = React.useMemo(() => {
    return selected ? dayjs(selected) : null
  }, [selected])

  const handleChange = (date: Dayjs | null) => {
    onSelect(date ? date.toDate() : undefined)
  }

  return (
    <div className="relative w-full">
      <AntDatePicker
        value={dayjsValue}
        onChange={handleChange}
        locale={esES.DatePicker}
        format="DD/MM/YYYY"
        placeholder="Selecciona una fecha"
        className="w-full"
        style={{ width: "100%" }}
        size="large"
      />
      {rightSlot && (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-600 bg-white/70 px-1 rounded"
          aria-label="Información adicional de la fecha"
        >
          {rightSlot}
        </span>
      )}
    </div>
  )
}
