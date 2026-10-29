import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { Incidencia } from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';
import { IncidenciaItemComponent } from '../shared/incidencia-item.component';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IncidenciaItemComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Incidencias en Seguimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="app-container">
        <div class="panel" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 14px 16px;">
          <div class="panel-header-icon" style="margin: 0;">
            <ion-icon name="bookmark-outline"></ion-icon>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--brand-navy);">Monitoreo Ciudadano</h4>
            <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--brand-text-secondary);">
              Reportes marcados para seguimiento prioritario en este dispositivo.
            </p>
          </div>
        </div>

        @if (cargando()) {
          <div class="estado-vacio">
            <ion-spinner color="primary"></ion-spinner>
            <p class="estado-vacio-desc" style="margin-top: 10px;">Consultando tus incidencias...</p>
          </div>
        }

        @if (error()) {
          <div class="estado-vacio">
            <ion-icon name="alert-circle-outline" class="estado-vacio-icon" color="danger"></ion-icon>
            <h3 class="estado-vacio-title">Error al consultar</h3>
            <p class="estado-vacio-desc">No se pudo consultar el servicio de incidencias.</p>
            <ion-button fill="outline" color="primary" (click)="cargar()">
              <ion-icon slot="start" name="refresh-outline"></ion-icon>
              Reintentar
            </ion-button>
          </div>
        }

        @for (i of visibles(); track i.id) {
          <app-incidencia-item [inc]="i"></app-incidencia-item>
        }

        @if (!cargando() && !error() && visibles().length === 0) {
          <div class="estado-vacio">
            <ion-icon name="bookmark-outline" class="estado-vacio-icon"></ion-icon>
            <h3 class="estado-vacio-title">Sin incidencias guardadas</h3>
            <p class="estado-vacio-desc">
              Toca el icono de marcador en cualquier incidencia de la lista o detalle para monitorearla aquí.
            </p>
          </div>
        }
      </div>
    </ion-content>
  `,
})
export class SeguimientoPage {
  private api = inject(IncidenciasService);
  seg = inject(SeguimientoService);

  items = signal<Incidencia[]>([]);
  cargando = signal(false);
  error = signal(false);

  // Solo se muestran las que siguen marcadas: al desmarcar una, desaparece al instante
  visibles = computed(() => this.items().filter(i => this.seg.esMarcada(i.codigo)));

  ionViewWillEnter() {
    this.cargar();
  }

  // Solo LEE de la API; marcar o desmarcar nunca modifica el servicio remoto
  async cargar() {
    const codigos = this.seg.codigos();
    if (codigos.length === 0) {
      this.items.set([]);
      return;
    }

    this.cargando.set(true);
    this.error.set(false);
    try {
      const r = await firstValueFrom(forkJoin(codigos.map(c => this.api.porCodigo(c))));
      this.items.set(r.filter((x): x is Incidencia => !!x));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
