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
}
export function DatePicker({ selected, onSelect, placeholder = "Selecciona una fecha" }: DatePickerProps) {
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
          className="data-[empty=true]:text-muted-foreground w-full md:w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selected ? format(selected, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        style={{ 
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          // allow the custom month/year popovers to overflow the popover container
          overflow: 'visible',
          zIndex: 50
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
                <PopoverContent 
                  side="bottom" 
                  align="start" 
                  style={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    padding: 8, 
                    borderRadius: 6, 
                    zIndex: 60,
                    maxWidth: '90vw'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), i, 1))} 
                        style={{ 
                          padding: '6px 8px', 
                          borderRadius: 6, 
                          border: i === viewMonth.getMonth() ? '1px solid #2768F5' : '1px solid transparent', 
                          background: i === viewMonth.getMonth() ? '#eef2ff' : 'transparent', 
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
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
                <PopoverContent 
                  side="bottom" 
                  align="center" 
                  style={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    padding: 8, 
                    borderRadius: 6, 
                    zIndex: 60,
                    maxWidth: '90vw'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const yearBlockStart = Math.floor(viewMonth.getFullYear() / 12) * 12;
                      const y = yearBlockStart + i;
                      return (
                        <button 
                          key={y} 
                          onClick={() => setViewMonth(new Date(y, viewMonth.getMonth(), 1))} 
                          style={{ 
                            padding: '6px 8px', 
                            borderRadius: 6, 
                            border: y === viewMonth.getFullYear() ? '1px solid #2768F5' : '1px solid transparent', 
                            background: y === viewMonth.getFullYear() ? '#eef2ff' : 'transparent', 
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <button 
                      type="button" 
                      onClick={() => setViewMonth(new Date(viewMonth.getFullYear() - 12, viewMonth.getMonth(), 1))} 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      «
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setViewMonth(new Date(viewMonth.getFullYear() + 12, viewMonth.getMonth(), 1))} 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      »
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Calendar 
            mode="single" 
            selected={selected} 
            onSelect={onSelect}
            className="rounded-md text-sm"
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