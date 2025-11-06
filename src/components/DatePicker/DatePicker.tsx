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
}

export const DatePicker = ({ selected, onSelect }: DatePickerProps) => {
  const dayjsValue = React.useMemo(() => {
    return selected ? dayjs(selected) : null
  }, [selected])

  const handleChange = (date: Dayjs | null) => {
    onSelect(date ? date.toDate() : undefined)
  }

  return (
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
  )
}
