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
  message: string;
  actividad: Actividad;
}

interface ApiError extends Error {
  status?: number;
  payload?: unknown;
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

export function getPersonas(
  params: GetPersonasParams = {}
): Promise<PaginatedResponse<Persona>> {
  const { cedula, nombreCompleto, currentPage, limit } = params;
  const searchParams = new URLSearchParams();
  if (cedula) searchParams.set("cedula", cedula);
  if (nombreCompleto) searchParams.set("nombreCompleto", nombreCompleto);
  if (currentPage) searchParams.set("currentPage", String(currentPage));
  if (limit) searchParams.set("limit", String(limit));

  const qp = searchParams.toString();
  return request<PaginatedResponse<Persona>>(`/personas${qp ? `?${qp}` : ""}`);
}

export function createPersona(payload: CreatePersonaPayload): Promise<Persona> {
  return request<Persona>("/personas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function getActividadesSemana(
  params: GetActividadesSemanaParams = {}
): Promise<Actividad[]> {
  const { fecha } = params;
  const searchParams = new URLSearchParams();
  if (fecha) searchParams.set("fecha", fecha);
  const qp = searchParams.toString();
  return request<Actividad[]>(`/actividades/semana${qp ? `?${qp}` : ""}`);
}

export function asistirActividad(
  id: string,
  personaId: string
): Promise<AsistenciaResponse> {
  if (!id) throw new Error("Clase id requerido");
  if (!personaId) throw new Error("personaId requerido");
  return request<AsistenciaResponse>(`/actividades/${id}/asistir`, {
    method: "POST",
    body: JSON.stringify({ personaId }),
  });
}

export default {
  getPersonas,
  createPersona,
  getActividades,
  createActividad,
  getActividadesSemana,
  asistirActividad,
};
