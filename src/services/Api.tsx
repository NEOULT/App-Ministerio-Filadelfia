// Tipos de datos
export interface Persona {
  _id: string;
  cedula: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Actividad {
  _id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  asistentes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface GetPersonasParams {
  cedula?: string;
  nombreCompleto?: string;
  currentPage?: number;
  limit?: number;
}

export interface CreatePersonaPayload {
  // Payload keys use snake_case to match backend expectations
  cedula?: string | number;
  nombre?: string;
  apellido?: string;
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  ministerio?: string;
  nivel_academico?: string;
  ocupacion?: string;
  bautizado?: boolean;
  genero?: string;
}

export interface CreateActividadPayload {
  titulo: string;
  descripcion?: string;
  fecha: string;
  asistentes?: string[];
  ponentes?: string[];
}

export interface GetActividadesSemanaParams {
  fecha?: string;
}

export interface AsistenciaResponse {
  message?: string;
  actividad?: Actividad;
  // registered: whether the person was newly marked as attended (true) or was already registered (false)
  registered?: boolean;
}

interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}

interface ApiEnvelope<T = unknown> {
  status?: string;
  data?: T;
  [key: string]: unknown;
}

const API_BASE = "https://backend01-proyecto-jovenes-phru.vercel.app";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText) as ApiError;
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

export async function getPersonas(
  params: GetPersonasParams = {}
): Promise<PaginatedResponse<Persona>> {
  const { cedula, nombreCompleto, currentPage, limit } = params;
  const searchParams = new URLSearchParams();
  if (cedula) searchParams.set("cedula", cedula);
  if (nombreCompleto) searchParams.set("nombreCompleto", nombreCompleto);
  if (currentPage) searchParams.set("currentPage", String(currentPage));
  if (limit) searchParams.set("limit", String(limit));

  const qp = searchParams.toString();
  const res = await request<ApiEnvelope<PaginatedResponse<Persona>> | Persona[]>(`/personas${qp ? `?${qp}` : ""}`);

  // If backend returned an envelope with .data (paginated), return it
  if (res && typeof res === 'object' && Array.isArray((res as ApiEnvelope).data)) {
    return (res as ApiEnvelope<PaginatedResponse<Persona>>).data as PaginatedResponse<Persona>;
  }

  // If backend returned a plain array of personas, synthesize a PaginatedResponse
  if (Array.isArray(res)) {
    const arr = res as Persona[];
    return {
      data: arr,
      currentPage: 1,
      totalPages: 1,
      totalItems: arr.length,
      limit: arr.length,
    } as PaginatedResponse<Persona>;
  }

  // Fallback empty
  return {
    data: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 0,
  };
}

export async function createPersona(payload: CreatePersonaPayload): Promise<Persona> {
  // The backend returns an envelope { status, data } — unwrap data for callers
  const res = await request<ApiEnvelope<Persona>>("/personas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res && typeof res === "object" && "data" in res && res.data) {
    return res.data as Persona;
  }
  // Fallback: if backend returned the persona directly
  return (res as unknown) as Persona;
}

export function getActividades(): Promise<Actividad[]> {
  return request<Actividad[]>("/actividades");
}

export function createActividad(
  payload: CreateActividadPayload
): Promise<Actividad> {
  return request<Actividad>("/actividades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getActividadesSemana(
  params: GetActividadesSemanaParams = {}
): Promise<Actividad[]> {
  const { fecha } = params;
  const searchParams = new URLSearchParams();
  if (fecha) searchParams.set("fecha", fecha);
  const qp = searchParams.toString();
  // backend returns envelope { status, from, to, count, data }
  const res = await request<ApiEnvelope<Actividad[]>>(`/actividades/semana${qp ? `?${qp}` : ""}`);
  if (res && typeof res === "object" && Array.isArray(res.data)) {
    return res.data as Actividad[];
  }
  // fallback: if API already returned an array
  if (Array.isArray(res)) return res as Actividad[];
  return [];
}

export async function asistirActividad(
  id: string,
  personaId: string
): Promise<ApiEnvelope<AsistenciaResponse> | AsistenciaResponse> {
  if (!id) throw new Error("Clase id requerido");
  if (!personaId) throw new Error("personaId requerido");
  const res = await request<ApiEnvelope<AsistenciaResponse>>(`/actividades/${id}/asistir`, {
    method: "POST",
    body: JSON.stringify({ personaId }),
  });
  // return the envelope so callers can inspect 'registered' and 'message'
  return res as ApiEnvelope<AsistenciaResponse>;
}

export default {
  getPersonas,
  createPersona,
  getActividades,
  createActividad,
  getActividadesSemana,
  asistirActividad,
};
