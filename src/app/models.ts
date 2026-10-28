export type Tipo = 'luminaria' | 'bache' | 'senalizacion' | 'alcantarilla' | 'parque';
export type Prioridad = 'baja' | 'media' | 'alta';
export type Estado = 'pendiente' | 'en_proceso' | 'resuelta';

export interface Incidencia {
  id?: string;
  codigo: string;
  tipo: Tipo;
  descripcion: string;
  direccion: string;
  sector: string;
  fecha: string;
  estado: Estado;
  prioridad: Prioridad;
  foto: string;
  lat: number | null;
  lng: number | null;
  observacion: string;
}

export interface Clima {
  lat: number;
  lng: number;
  temperatura: number;
  precipitacion: number;
  descripcion: string;
  hora: string;
}

export const TIPOS: { valor: Tipo; etiqueta: string }[] = [
  { valor: 'luminaria', etiqueta: 'Luminaria dañada' },
  { valor: 'bache', etiqueta: 'Bache' },
  { valor: 'senalizacion', etiqueta: 'Señalización deteriorada' },
  { valor: 'alcantarilla', etiqueta: 'Alcantarilla obstruida' },
  { valor: 'parque', etiqueta: 'Daño en parque' },
];

export const etiquetaTipo = (t: Tipo) => TIPOS.find(x => x.valor === t)?.etiqueta ?? t;

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
};

export const COLOR_ESTADO: Record<Estado, string> = {
  pendiente: 'warning',
  en_proceso: 'primary',
  resuelta: 'success',
};

// R9: transiciones de estado permitidas
export const TRANSICIONES: Record<Estado, Estado[]> = {
  pendiente: ['en_proceso', 'resuelta'],
  en_proceso: ['resuelta'],
  resuelta: [],
};

export const num = (s: string) => Number(String(s).trim().replace(',', '.'));
