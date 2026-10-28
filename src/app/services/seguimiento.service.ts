import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private KEY = 'seguimiento';
  codigos = signal<string[]>([]);

  async init() {
    const { value } = await Preferences.get({ key: this.KEY });
    try {
      this.codigos.set(value ? JSON.parse(value) : []);
    } catch {
      this.codigos.set([]);
    }
  }

  esMarcada(codigo: string) {
    return this.codigos().includes(codigo);
  }

  // R1: solo se guarda en el telefono, nunca se envia a la API
  async alternar(codigo: string) {
    const nuevos = this.esMarcada(codigo)
      ? this.codigos().filter(c => c !== codigo)
      : [...this.codigos(), codigo];
    this.codigos.set(nuevos);
    await Preferences.set({ key: this.KEY, value: JSON.stringify(nuevos) });
  }
}
