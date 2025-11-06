import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input/Input";
import { SuccessDialog } from "@/components/SuccessDialog/SuccessDialog";
import { getPersonas, getActividadesSemana, asistirActividad, type Persona } from '@/services/Api'

interface AsistenceModalProps {
  onRegisterRedirect?: (initial: Record<string, string>) => void;
  actividadId?: string;
}

export const AsistenceModal = ({ onRegisterRedirect, actividadId }: AsistenceModalProps) => {
  const [cedula, setCedula] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [foundPerson, setFoundPerson] = useState<Persona | null>(null);
  const [lastRegistered, setLastRegistered] = useState<boolean | undefined>(undefined);

  const extractAsistirResult = (resp: unknown) => {
    if (!resp) return { registered: undefined as boolean | undefined, message: undefined as string | undefined };
    const asRec = resp as Record<string, unknown>;
    if (typeof asRec.registered === 'boolean' || typeof asRec.message === 'string') {
      return { registered: asRec.registered as boolean | undefined, message: asRec.message as string | undefined };
    }
    if (asRec.data && typeof asRec.data === 'object') {
      const asData = (asRec.data as Record<string, unknown>)
      if (typeof asData.registered === 'boolean' || typeof asData.message === 'string') {
        return { registered: asData.registered as boolean | undefined, message: asData.message as string | undefined };
      }
    }
    return { registered: undefined as boolean | undefined, message: undefined as string | undefined };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = cedula.trim()
    if (!q) return
    setIsLoading(true)
    setMessage(null)
    setNotRegistered(false)
    try {
      const isNumeric = /^\d+$/.test(q)
      const params = isNumeric ? { cedula: q } : { nombreCompleto: q }
      const res = await getPersonas(params)
      const persons = Array.isArray(res.data) ? res.data : []
      if (persons.length > 0) {
        // show only the first matching record and wait for user confirmation to mark attendance
        const persona = persons[0] as Persona
        setFoundPerson(persona)
        setMessage(null)
      } else {
        // not registered: prepare redirect to form with prefill
        setNotRegistered(true)
        setMessage('No se encontró una persona con esos datos.')
      }
    } catch (err) {
      console.error('Error buscando persona:', err)
      setMessage('Error al buscar. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setCedula("");
    setIsOpen(false);
    setLastRegistered(undefined);
    setMessage(null);
  };

  const handleRedirectToForm = () => {
    const q = cedula.trim()
    const isNumeric = /^\d+$/.test(q)
    const prefill: Record<string, string> = {}
    if (isNumeric) prefill.cedula = q
    else prefill.nombre = q
    if (typeof onRegisterRedirect === 'function') {
      onRegisterRedirect(prefill)
    } else {
      try { sessionStorage.setItem('prefill_persona', JSON.stringify(prefill)) } catch { /* ignore */ }
      window.location.hash = '#/form'
    }
    setIsOpen(false)
  }

  const handleConfirmMark = async (persona: Persona) => {
    // mark attendance for the given found person (first activity of the day)
    setIsLoading(true)
    setMessage(null)
    try {
      // choose actividad: prefer actividadId prop, otherwise pick today's first actividad
      let actividadToUse: string | undefined = actividadId;
      if (!actividadToUse) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const fechaHoy = `${yyyy}-${mm}-${dd}`
        const actividades = await getActividadesSemana({ fecha: fechaHoy })
        const list = Array.isArray(actividades) ? actividades : []
        if (list.length === 0) {
          setMessage('No hay actividades programadas para hoy.')
          return
        }
        actividadToUse = list[0]._id
      }
      const resp = await asistirActividad(actividadToUse, persona._id)
      const { registered: registeredFlag, message: backendMsg } = extractAsistirResult(resp)
      console.debug('asistirActividad response:', { resp, registeredFlag, backendMsg })
      setLastRegistered(registeredFlag as boolean | undefined)
      const pObj = persona as unknown as Record<string, unknown>
      const displayName = typeof pObj.nombreCompleto === 'string'
        ? pObj.nombreCompleto
        : `${String(pObj.nombre ?? '')} ${String(pObj.apellido ?? '')}`.trim()
      if (registeredFlag === false) {
        setMessage(backendMsg || `La persona ${displayName || persona._id} ya estaba registrada para esta clase.`)
        setShowSuccess(true)
      } else {
        setMessage(backendMsg || `Asistencia registrada para ${displayName || persona._id}.`)
        setShowSuccess(true)
      }
    } catch (err) {
      console.error('Error marcando asistencia:', err)
      setMessage('No se pudo registrar la asistencia automáticamente.')
    } finally {
      setIsLoading(false)
      setFoundPerson(null)
    }
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger 
          className="w-[200px] mt-4 px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none"
          style={{ backgroundColor: '#2768F5', color: '#ffffff' }}
        >
          Registrar Asistencia
        </AlertDialogTrigger>
        <AlertDialogContent style={{ backgroundColor: '#ffffff', color: '#1f2937', maxWidth: '500px' }}>
          <AlertDialogHeader>
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#172554' }}>
              Registro de Asistencia
            </h2>
            <AlertDialogDescription style={{ color: '#4b5563', fontSize: '1rem', textAlign: 'center' }}>
              Ingresa tu cédula para confirmar tu asistencia
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <Input
              label="Cédula de Identidad o"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="V-12345678 ó Juan Pérez"
              required
            />
            {!foundPerson ? (
              <>
                {message && <p className="text-sm text-gray-700">{message}</p>}
                {notRegistered && (
                  <div className="text-sm mt-2">
                    <p>No te has registrado?</p>
                    <button className="text-blue-600 underline" type="button" onClick={handleRedirectToForm}>Presiona acá</button>
                  </div>
                )}
              </>
            ) : (
              <div className="border rounded p-3 bg-gray-50">
                <h4 className="font-semibold">Persona encontrada</h4>
                {(() => {
                  const pObj = foundPerson as unknown as Record<string, unknown>
                  const nombre = typeof pObj.nombreCompleto === 'string' ? pObj.nombreCompleto : `${String(pObj.nombre ?? '')} ${String(pObj.apellido ?? '')}`.trim()
                  return (
                    <>
                      <p className="text-sm text-gray-700">{nombre || '-'}</p>
                    </>
                  )
                })()}
                <div className="flex gap-2 justify-end mt-3">
                  <Button type="button" variant="outline" onClick={() => { setFoundPerson(null); setMessage(null); setNotRegistered(false); }}>
                    Buscar otra
                  </Button>
                  <Button type="button" onClick={() => handleConfirmMark(foundPerson)} style={{ backgroundColor: '#2768F5', color: '#fff' }}>
                    {isLoading ? 'Procesando...' : 'Marcar asistencia'}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-white"
                style={{  
                  color: '#ef4444',
                  backgroundColor: 'transparent',
                  border: '1px solid #e5e7eb'
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <SuccessDialog
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        title={lastRegistered === false ? "Asistencia existente" : "¡Asistencia Registrada!"}
        message={message || (lastRegistered === false ? "La persona ya estaba registrada en esta clase." : "Tu asistencia ha sido registrada exitosamente. ¡Gracias por estar presente!")}
      />
    </>
  );
};

