import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import {IonButton,IonContent,IonHeader,IonSpinner,IonTitle,IonToolbar,} from '@ionic/angular';
import { Incidencia } from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';
import { IncidenciaItemComponent } from '../shared/incidencia-item.component';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButton, IncidenciaItemComponent],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Seguimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando()) {
        <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
      }

      @if (error()) {
        <div class="ion-padding ion-text-center">
          <p>No se pudo consultar el servicio de incidencias.</p>
          <ion-button (click)="cargar()">Reintentar</ion-button>
        </div>
      }

      @for (i of visibles(); track i.id) {
        <app-incidencia-item [inc]="i"></app-incidencia-item>
      }

      @if (!cargando() && !error() && visibles().length === 0) {
        <p class="ion-padding ion-text-center">No hay incidencias en seguimiento.</p>
      }
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
