import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, timeout } from 'rxjs';
import { CONFIG } from '../config';
import { Clima } from '../models';

const WMO: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia',
  65: 'Lluvia fuerte',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos violentos',
  95: 'Tormenta',
  96: 'Tormenta con granizo',
  99: 'Tormenta con granizo fuerte',
};

@Injectable({ providedIn: 'root' })
export class ClimaService {
  private http = inject(HttpClient);

  consultar(lat: number, lng: number) {
    return this.http
      .get<any>(CONFIG.clima, {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,precipitation,weather_code',
          timezone: 'auto',
        },
      })
      .pipe(
        timeout(8000),
        map((r): Clima => {
          const c = r?.current;
          // Sin datos se lanza error: nunca se inventan valores
          if (!c || c.temperature_2m == null || c.precipitation == null) {
            throw new Error('Sin datos meteorologicos');
          }
          return {
            lat,
            lng,
            temperatura: c.temperature_2m,
            precipitacion: c.precipitation,
            descripcion: WMO[c.weather_code] ?? `Condicion ${c.weather_code}`,
            hora: c.time,
          };
        })
      );
  }
}
