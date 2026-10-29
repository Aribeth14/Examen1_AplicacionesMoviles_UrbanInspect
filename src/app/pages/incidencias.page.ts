import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CONFIG } from '../config';
import type { Incidencia } from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { IncidenciaItemComponent } from '../shared/incidencia-item.component';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonButton,
    IncidenciaItemComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Incidencias Reportadas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="app-container">
        @for (i of items(); track i.id) {
          <app-incidencia-item [inc]="i"></app-incidencia-item>
        }

        @if (cargando() && items().length === 0) {
          <div class="estado-vacio">
            <ion-spinner color="primary"></ion-spinner>
            <p class="estado-vacio-desc" style="margin-top: 10px;">Cargando incidencias...</p>
          </div>
        }

        @if (!cargando() && !error() && items().length === 0) {
          <div class="estado-vacio">
            <ion-icon name="list-outline" class="estado-vacio-icon"></ion-icon>
            <h3 class="estado-vacio-title">No hay incidencias</h3>
            <p class="estado-vacio-desc">No existen reportes registrados actualmente.</p>
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

        @if (fin() && items().length > 0) {
          <div class="fin-lista">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <span>No hay más incidencias para mostrar</span>
          </div>
        }

        <ion-infinite-scroll (ionInfinite)="cargar($event)" [disabled]="fin()">
          <ion-infinite-scroll-content
            loadingSpinner="bubbles"
            loadingText="Cargando más incidencias..."
          ></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>
    </ion-content>
  `,
})
export class IncidenciasPage {
  private api = inject(IncidenciasService);

  items = signal<Incidencia[]>([]);
  cargando = signal(false);
  error = signal(false);
  fin = signal(false);
  private pagina = 0;

  // Al volver a esta pestana se recarga desde la pagina 1: refleja altas y cambios (R10)
  ionViewWillEnter() {
    this.reiniciar();
  }

  reiniciar() {
    this.items.set([]);
    this.pagina = 0;
    this.fin.set(false);
    this.error.set(false);
    return this.cargar();
  }

  async refrescar(ev: Event) {
    await this.reiniciar();
    (ev.target as any).complete();
  }

  async cargar(ev?: Event) {
    const terminar = () => (ev?.target as any)?.complete?.();

    // Si ya no hay mas registros, no se vuelve a pedir ninguna pagina
    if (this.fin() || this.cargando()) {
      terminar();
      return;
    }

    this.cargando.set(true);
    this.error.set(false);
    try {
      const r = await firstValueFrom(this.api.listar(this.pagina + 1));
      this.items.update(a => [...a, ...r]);
      this.pagina++;
      // Pagina incompleta o vacia = no quedan mas registros
      if (r.length < CONFIG.pagina) this.fin.set(true);
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
      terminar();
    }
  }
}
