import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {IonButton,IonContent,IonHeader,IonInfiniteScroll,IonInfiniteScrollContent,IonRefresher,IonRefresherContent,
  IonSpinner,IonTitle,IonToolbar,} from '@ionic/angular';
import { CONFIG } from '../config';
import { Incidencia } from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { IncidenciaItemComponent } from '../shared/incidencia-item.component';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [IonHeader,IonToolbar,IonTitle,IonContent,IonInfiniteScroll,IonInfiniteScrollContent,IonRefresher,
    IonRefresherContent,IonSpinner,IonButton,IncidenciaItemComponent,],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Incidencias</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @for (i of items(); track i.id) {
        <app-incidencia-item [inc]="i"></app-incidencia-item>
      }

      @if (cargando() && items().length === 0) {
        <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
      }

      @if (!cargando() && !error() && items().length === 0) {
        <p class="ion-padding ion-text-center">No hay incidencias registradas.</p>
      }

      @if (error()) {
        <div class="ion-padding ion-text-center">
          <p>No se pudo consultar el servicio de incidencias.</p>
          <ion-button (click)="cargar()">Reintentar</ion-button>
        </div>
      }

      @if (fin() && items().length > 0) {
        <p class="ion-text-center"><small>No hay más incidencias</small></p>
      }

      <ion-infinite-scroll (ionInfinite)="cargar($event)" [disabled]="fin()">
        <ion-infinite-scroll-content loadingText="Cargando más..."></ion-infinite-scroll-content>
      </ion-infinite-scroll>
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
