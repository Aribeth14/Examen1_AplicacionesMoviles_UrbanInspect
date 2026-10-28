import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { CONFIG } from '../config';
import { Estado, Incidencia, TRANSICIONES } from '../models';

// MockAPI responde 404 cuando no hay registros o la pagina no existe: se trata como lista vacia
function vacioSi404<T>(vacio: T) {
  return (o: Observable<T>) =>
    o.pipe(catchError(e => (e.status === 404 ? of(vacio) : throwError(() => e))));
}

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private http = inject(HttpClient);
  private url = CONFIG.api;

  // Paginacion remota: el servidor entrega solo "limit" registros por pagina
  listar(pagina: number) {
    return this.http
      .get<Incidencia[]>(this.url, {
        params: { page: pagina, limit: CONFIG.pagina, sortBy: 'fecha', order: 'desc' },
      })
      .pipe(vacioSi404<Incidencia[]>([]));
  }

  obtener(id: string) {
    return this.http.get<Incidencia>(`${this.url}/${id}`);
  }

  porCodigo(codigo: string) {
    return this.http.get<Incidencia[]>(this.url, { params: { codigo } }).pipe(
      vacioSi404<Incidencia[]>([]),
      map(r => r.find(i => i.codigo === codigo) ?? null)
    );
  }

  private contar(estado: Estado) {
    return this.http.get<Incidencia[]>(this.url, { params: { estado } }).pipe(
      vacioSi404<Incidencia[]>([]),
      map(r => r.filter(i => i.estado === estado).length)
    );
  }

  resumen() {
    return forkJoin({
      pendiente: this.contar('pendiente'),
      en_proceso: this.contar('en_proceso'),
      resuelta: this.contar('resuelta'),
    });
  }

  crear(inc: Incidencia) {
    return this.http.post<Incidencia>(this.url, inc);
  }

  // R9: se relee el registro del servidor antes de validar la transicion
  cambiarEstado(id: string, nuevo: Estado, observacion: string) {
    return this.obtener(id).pipe(
      switchMap(actual => {
        if (!TRANSICIONES[actual.estado].includes(nuevo)) {
          return throwError(() => new Error('Transicion de estado no permitida'));
        }
        if (nuevo === 'resuelta' && !observacion.trim()) {
          return throwError(() => new Error('La observacion es obligatoria para resolver'));
        }
        return this.http.put<Incidencia>(`${this.url}/${id}`, {
          estado: nuevo,
          observacion: observacion.trim() || actual.observacion,
        });
      })
    );
  }
}
