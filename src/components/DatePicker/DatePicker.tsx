"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  // optional node to render at the right side of the trigger (e.g. age)
  rightSlot?: React.ReactNode;
}
export function DatePicker({ selected, onSelect, placeholder = "Selecciona una fecha", rightSlot }: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const fromYear = 1990;
  const toYear = currentYear;
  // react-day-picker renamed fromMonth/toMonth -> startMonth/endMonth
  const startMonth = new Date(fromYear, 0);
  const endMonth = new Date(toYear, 11);

  const initialMonth = selected || startMonth;
  const [viewMonth, setViewMonth] = React.useState<Date>(initialMonth);

  React.useEffect(() => {
    // keep viewMonth in sync when selected changes externally
    if (selected) setViewMonth(selected);
  }, [selected]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal flex items-center"
        >
          <CalendarIcon />
          <span style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ flex: '0 0 auto' }}>{selected ? format(selected, 'dd/MM/yyyy', { locale: es }) : <span>{placeholder}</span>}</span>
            {rightSlot && <span style={{ marginLeft: 'auto', color: '#374151', fontWeight: 600 }}>{rightSlot}</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        style={{ 
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          // allow the custom month/year popovers to overflow the popover container
          overflow: 'visible'
        }}
      >
  <div style={{ position: 'relative' }}>
          {/* overlay header positioned where the calendar caption normally is */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 20, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
            <div style={{ pointerEvents: 'auto' }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{viewMonth.toLocaleString('es-ES', { month: 'long' })}</button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, zIndex: 60 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <button key={i} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), i, 1))} style={{ padding: '6px 8px', borderRadius: 6, border: i === viewMonth.getMonth() ? '1px solid #2768F5' : '1px solid transparent', background: i === viewMonth.getMonth() ? '#eef2ff' : 'transparent', cursor: 'pointer' }}>
                        {new Date(0, i).toLocaleString('es-ES', { month: 'short' })}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div style={{ pointerEvents: 'auto' }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{viewMonth.getFullYear()}</button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, zIndex: 60 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const yearBlockStart = Math.floor(viewMonth.getFullYear() / 12) * 12;
                      const y = yearBlockStart + i;
                      return (
                        <button key={y} onClick={() => setViewMonth(new Date(y, viewMonth.getMonth(), 1))} style={{ padding: '6px 8px', borderRadius: 6, border: y === viewMonth.getFullYear() ? '1px solid #2768F5' : '1px solid transparent', background: y === viewMonth.getFullYear() ? '#eef2ff' : 'transparent', cursor: 'pointer' }}>
                          {y}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear() - 12, viewMonth.getMonth(), 1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>«</button>
                    <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear() + 12, viewMonth.getMonth(), 1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>»</button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Calendar 
            mode="single" 
            selected={selected} 
            onSelect={onSelect}
            className="rounded-md text-sm scale-90"
            captionLayout="label"
            classNames={{ caption_label: 'invisible' }}
            month={viewMonth}
            onMonthChange={(d) => setViewMonth(d)}
            startMonth={startMonth}
            endMonth={endMonth}
          locale={es}
          defaultMonth={selected || new Date(1990, 0)}
          formatters={{
            formatMonthDropdown: (date) =>
              date.toLocaleString("es-ES", { month: "long" }),
            formatYearDropdown: (date) => date.getFullYear().toString(),
          }}
        />
        </div>
      </PopoverContent>
    </Popover>
  );
}
