import React, { useState } from 'react'
import { createActividad, type CreateActividadPayload } from '../../services/Api'
import { Input } from '../Input/Input'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface ClaseFormProps {
  onCreated?: () => void
}

interface FormData {
  titulo: string
  fecha: Date | null
  descripcion: string
}

export default function ClaseForm({ onCreated }: ClaseFormProps) {
  const [form, setForm] = useState<FormData>({ titulo: '', fecha: null, descripcion: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
  const errs: Partial<Record<keyof FormData, string>> = {}
  if (!form.titulo.trim()) errs.titulo = 'El título es requerido'
    if (!form.fecha) errs.fecha = 'La fecha es requerida'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    try {
      setSaving(true)
      const payload: CreateActividadPayload = {
        titulo: form.titulo.trim(),
        fecha: form.fecha!.toISOString().split('T')[0],
      }
      if (form.descripcion && form.descripcion.trim()) {
        payload.descripcion = form.descripcion.trim()
      }
      // backend accepts asistentes and ponentes arrays; send empty arrays by default
      payload.asistentes = []
      payload.ponentes = []
      await createActividad(payload)
      setForm({ titulo: '', fecha: null, descripcion: '' })
      onCreated?.()
    } catch (e) {
      setError((e as Error).message || 'Error al crear la clase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.25rem', fontWeight: 600 }}>Crear nueva clase</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Título de la clase"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ej: Estudio Bíblico"
            className={fieldErrors.titulo ? 'border-red-500' : ''}
          />
          {fieldErrors.titulo && <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.titulo}</small>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Fecha
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className={`w-full justify-start text-left font-normal ${!form.fecha && 'text-muted-foreground'} ${fieldErrors.fecha ? 'border-red-500' : ''}`}
                style={{ height: '35px' }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.fecha ? format(form.fecha, 'yyyy-MM-dd') : 'Selecciona una fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.fecha || undefined}
                onSelect={(date) => setForm({ ...form, fecha: date || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {fieldErrors.fecha && <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.fecha}</small>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
          Descripción (opcional)
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Descripción de la actividad"
          rows={3}
          className="border rounded-2xl w-full px-4 py-2 outline-none transition"
          style={{
            borderColor: '#d1d5db',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            resize: 'vertical'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <div style={{ textAlign: 'right' }}>
        <Button type="submit" disabled={saving} variant="outline">
          {saving ? 'Creando...' : 'Crear Clase'}
        </Button>
      </div>

      {error && <div style={{ color: 'red', marginTop: 8, fontSize: '0.875rem' }}>{error}</div>}
    </form>
  )
}
