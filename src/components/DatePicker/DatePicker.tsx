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
  rightSlot?: React.ReactNode;
}

export function DatePicker({ selected, onSelect, placeholder = "Selecciona una fecha", rightSlot }: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const fromYear = 1990;
  const toYear = currentYear;
  const startMonth = new Date(fromYear, 0);
  const endMonth = new Date(toYear, 11);

  const initialMonth = selected || startMonth;
  const [viewMonth, setViewMonth] = React.useState<Date>(initialMonth);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = React.useState(false);
  const [isYearPopoverOpen, setIsYearPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [selected]);

  const handleMonthSelect = (monthIndex: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), monthIndex, 1));
    setIsMonthPopoverOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setIsYearPopoverOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    onSelect(date);
    setIsPopoverOpen(false);
  };

  const handleNavigation = (years: number) => {
    setViewMonth(new Date(viewMonth.getFullYear() + years, viewMonth.getMonth(), 1));
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className="data-[empty=true]:text-muted-foreground w-full md:w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">
            {selected ? format(selected, "dd/MM/yyyy", { locale: es }) : <span>{placeholder}</span>}
          </span>
          {rightSlot && (
            <span className="ml-3 text-sm text-muted-foreground" aria-hidden>
              {rightSlot}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="center"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        style={{ 
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          overflow: 'visible',
          zIndex: 50,
          maxWidth: 'calc(100vw - 32px)',
          // Centrado mejorado
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          // Asegurar que esté por encima de todo
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="relative">
          {/* Header con mes y año */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center pt-4 pb-2 px-4 pointer-events-none z-50">
            {/* Selector de Mes */}
            <div className="pointer-events-auto w-full sm:w-auto">
              <Popover open={isMonthPopoverOpen} onOpenChange={setIsMonthPopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="w-full sm:w-auto px-4 py-3 text-base font-semibold text-center bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors touch-manipulation"
                  >
                    {viewMonth.toLocaleString('es-ES', { month: 'long' })}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="bottom" 
                  align="center"
                  className="w-80 max-w-[90vw] p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-60"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                  }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleMonthSelect(i)} 
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors touch-manipulation ${
                          i === viewMonth.getMonth() 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {new Date(0, i).toLocaleString('es-ES', { month: 'short' })}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selector de Año */}
            <div className="pointer-events-auto w-full sm:w-auto">
              <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="w-full sm:w-auto px-4 py-3 text-base font-semibold text-center bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors touch-manipulation"
                  >
                    {viewMonth.getFullYear()}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="bottom" 
                  align="center"
                  className="w-80 max-w-[90vw] p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-60"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                  }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const yearBlockStart = Math.floor(viewMonth.getFullYear() / 12) * 12;
                      const y = yearBlockStart + i;
                      return (
                        <button 
                          key={y} 
                          onClick={() => handleYearSelect(y)} 
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors touch-manipulation ${
                            y === viewMonth.getFullYear() 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleNavigation(-12)} 
                      className="px-4 py-2 text-lg font-bold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                    >
                      «
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleNavigation(12)} 
                      className="px-4 py-2 text-lg font-bold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                    >
                      »
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Calendario */}
          <div className="px-2 pb-4">
            <Calendar 
              mode="single" 
              selected={selected} 
              onSelect={handleDateSelect}
              className="rounded-md text-sm"
              captionLayout="label"
              classNames={{ 
                caption_label: 'invisible',
                day: 'h-9 w-9 p-0 text-sm font-normal aria-selected:opacity-100',
                day_button: 'h-full w-full',
                head_cell: 'h-9 w-9 p-0 text-sm font-normal',
                cell: 'h-9 w-9 p-0 relative'
              }}
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
              style={{
                minWidth: '280px',
                maxWidth: '100%'
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}