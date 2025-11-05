import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input/Input";
import { DatePicker } from "@/components/DatePicker/DatePicker";
import { createPersona } from "@/services/Api";
import { SuccessDialog } from "@/components/SuccessDialog/SuccessDialog";

interface FormProps {
  onBack: () => void;
}

export const Form = ({ onBack }: FormProps) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
    fechaNacimiento: undefined as Date | undefined,
    // Persona additional optional fields
    bautizado: false,
    genero: "",
    ministerio: "",
    nivel_academico: "",
    ocupacion: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  // --- Phone and Cedula helpers (store digits; format for display) ---
  const formatPhoneDisplay = (digits: string) => {
    if (!digits) return "";
    const cleanDigits = digits.replace(/\D/g, "");
    if (cleanDigits.length <= 3) return cleanDigits;
    if (cleanDigits.length <= 6) return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3)}`;
    if (cleanDigits.length <= 8) return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`;
    return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6, 8)}-${cleanDigits.slice(8, 10)}`;
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value || "";
    // Remove non-digits, strip leading zeros, limit to 10 digits
    const digits = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    setFormData({ ...formData, telefono: digits });
  };

  const formatCedulaDisplay = (digits: string) => {
    const p = (digits || "").replace(/\D/g, "").slice(0, 8).padStart(8, '0');
    return `${p.slice(0, 2)}.${p.slice(2, 5)}.${p.slice(5)}`;
  };

  const onCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value || "";
    // Keep the rightmost 8 digits so the input visually fills from the right
    const digits = value.replace(/\D/g, '').slice(-8);
    setFormData({ ...formData, cedula: digits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación: nombre, apellido y fecha de nacimiento son obligatorios
    const errs: Partial<Record<string, string>> = {}
    if (!formData.nombre || !formData.nombre.trim()) errs.nombre = 'El nombre es requerido.'
    if (!formData.apellido || !formData.apellido.trim()) errs.apellido = 'El apellido es requerido.'
    if (!formData.fechaNacimiento) errs.fechaNacimiento = '   La fecha de nacimiento es requerida.'
    if (Object.keys(errs).length) {
      setFieldErrors((prev) => ({ ...prev, ...errs }))
      return
    }

    // Preparar payload en snake_case para el backend
    const payload = {
      cedula: formData.cedula || undefined,
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.correo || undefined,
      telefono: formData.telefono || undefined,
      fecha_nacimiento: formData.fechaNacimiento
        ? formData.fechaNacimiento.toISOString().slice(0, 10)
        : undefined,
      ministerio: formData.ministerio || undefined,
      nivel_academico: formData.nivel_academico || undefined,
      ocupacion: formData.ocupacion || undefined,
  // send bautizado explicitly (backend may require boolean)
  bautizado: formData.bautizado,
      genero: formData.genero || undefined,
    };

    try {
      // clear previous field errors
      setFieldErrors({});
  setIsSubmitting(true);
      const created: unknown = await createPersona(payload);
      // extract name from response if present (type-safe)
      let nameToShow = formData.nombre || "";
      if (created && typeof created === "object") {
        const c = created as Record<string, unknown>;
        if (typeof c["nombre"] === "string") nameToShow = c["nombre"] as string;
        else if (typeof c["nombre_completo"] === "string") nameToShow = c["nombre_completo"] as string;
      }
      setSuccessName(nameToShow);
      // Build a user-facing success message. Only promise follow-up messages if we have contact info.
      const base = "¡Gracias por registrarte en el Grupo de Jóvenes con Propósito!";
      const contactProvided = Boolean(formData.correo || formData.telefono);
      const followup = contactProvided
        ? " Pronto recibirás información sobre las actividades de los Jóvenes."
        : "";
      setSuccessMessage(`${base}${followup}`);
      setShowSuccess(true);
    } catch (err: unknown) {
      console.error("Error creando persona:", err);
      // If the API returned a structured payload with duplicate key info, map it to fieldErrors
      type ApiErrorPayload = { payload?: { code?: string; message?: string; errors?: Array<{ field: string; value?: unknown; message?: string }> } };
      const maybeErr = err as unknown as ApiErrorPayload;
      const payload = maybeErr?.payload;
      if (payload && payload.code === "DUPLICATE_KEY" && Array.isArray(payload.errors)) {
        const newFieldErrors: Partial<Record<string, string>> = {};
        for (const e of payload.errors) {
          // backend field names: 'cedula' or 'email'
          if (e.field === 'cedula') newFieldErrors.cedula = e.message || 'La cédula ya está registrada.';
          if (e.field === 'email') newFieldErrors.correo = e.message || 'El correo ya está registrado.';
        }
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
        // also show a general message from payload if present
      } 
    } finally {
      setIsSubmitting(false);
    }
  };

  // note: Confirmation dialog removed — submit sends directly to API

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessName("");
    
    // Limpiar el formulario
    setFormData({
      nombre: "",
      apellido: "",
      cedula: "",
      telefono: "",
      correo: "",
      fechaNacimiento: undefined,
      bautizado: false,
      genero: "",
      ministerio: "",
      nivel_academico: "",
      ocupacion: "",
    });
    
    // Volver a la página principal
    onBack();
  };

  return (
    <div className="flex justify-center items-center w-screen min-h-screen p-4" style={{ backgroundColor: '#dbeafe' }}>
      <div className="rounded-lg shadow-xl p-8 max-w-2xl w-full" style={{ backgroundColor: '#ffffff' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#172554' }}>
            Formulario de Inscripción
          </h2>
          <p className="text-center" style={{ color: '#4b5563' }}>
            Completa tus datos para unirte a la juventud
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Tu nombre"
              required
            />

            <Input
              label="Apellido"
              type="text"
              value={formData.apellido}
              onChange={(e) =>
                setFormData({ ...formData, apellido: e.target.value })
              }
              placeholder="Tu apellido"
              required
            />
          </div>

          <Input
            label="Cédula de Identidad"
            type="text"
            value={formatCedulaDisplay(formData.cedula)}
            onChange={onCedulaChange}
            placeholder="V-12345678"
            // opcional
          />
          {fieldErrors.cedula && (
            <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.cedula}</small>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={formData.fechaNacimiento}
                onSelect={(date) => {
                  setFormData({ ...formData, fechaNacimiento: date })
                  // clear fechaNacimiento error when user picks a date
                  setFieldErrors((prev) => {
                    const copy = { ...prev }
                    delete copy.fechaNacimiento
                    return copy
                  })
                }}
              />
              {fieldErrors.fechaNacimiento && (
                <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.fechaNacimiento}</small>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Género
              </label>
              <div className="flex items-center gap-6 mt-1">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="genero"
                    value="M"
                    checked={formData.genero === "M"}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="h-4 w-4 accent-blue-600 border-gray-300"
                  />
                  <span className="ml-2">Hombre</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="genero"
                    value="F"
                    checked={formData.genero === "F"}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="h-4 w-4 accent-blue-600 border-gray-300"
                  />
                  <span className="ml-2">Mujer</span>
                </label>
              </div>
            </div>
          </div>

          <Input
            label="Teléfono"
            type="tel"
            value={formatPhoneDisplay(formData.telefono)}
            onChange={onPhoneChange}
            inputMode="numeric"
            placeholder="414-123-4567"
            // opcional
          />

          <Input
            label="Correo Electrónico"
            type="email"
            value={formData.correo}
            onChange={(e) =>
              setFormData({ ...formData, correo: e.target.value })
            }
            placeholder="tu@correo.com"
            // opcional
          />
          {fieldErrors.correo && (
            <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.correo}</small>
          )}

          {/* Bautizado moved to the end of the form */}
          <Input
            label="Ministerio"
            type="text"
            value={formData.ministerio}
            onChange={(e) => setFormData({ ...formData, ministerio: e.target.value })}
            placeholder="Ministerio al que pertenece"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nivel Académico"
              type="text"
              value={formData.nivel_academico}
              onChange={(e) => setFormData({ ...formData, nivel_academico: e.target.value })}
              placeholder="Ej. Bachiller, TSU, Universitario"
            />

            <Input
              label="Ocupación"
              type="text"
              value={formData.ocupacion}
              onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
              placeholder="Profesión u ocupación"
            />
          </div>

          <div className="pt-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Bautizado
            </label>
            <div className="flex items-center gap-2">
              <input
                id="bautizado"
                type="checkbox"
                checked={formData.bautizado}
                onChange={(e) => setFormData({ ...formData, bautizado: e.target.checked })}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="bautizado" className="text-sm text-gray-700">Sí</label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onBack}
              style={{  color: '#ef4444',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb'}}
            >
              Volver
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              style={{ backgroundColor: '#2768F5', color: '#ffffff' }}
            >
              {isSubmitting ? "Enviando..." : "Enviar Inscripción"}
            </Button>
          </div>
        </form>
      </div>
      <SuccessDialog
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        nombre={successName}
        message={successMessage}
      />
    </div>
  );
};

