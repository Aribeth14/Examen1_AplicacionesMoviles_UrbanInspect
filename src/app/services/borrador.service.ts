import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class BorradorService {
  private KEY = 'borrador';
  restaurar = false; // el formulario lo lee al entrar para saber si debe cargar el borrador

  guardar(datos: unknown) {
    return Preferences.set({ key: this.KEY, value: JSON.stringify(datos) });
  }

  async obtener() {
    const { value } = await Preferences.get({ key: this.KEY });
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  limpiar() {
    return Preferences.remove({ key: this.KEY });
  }
}
