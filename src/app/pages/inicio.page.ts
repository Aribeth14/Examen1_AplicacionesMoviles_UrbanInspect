import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {IonButton,IonCard,IonCardContent,IonCol,IonContent,IonGrid,IonHeader,IonRefresher,
  IonRefresherContent,IonRow,IonSpinner,IonTitle,IonToolbar,} from '@ionic/angular';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [IonHeader,IonToolbar,IonTitle,IonContent,IonCard,IonCardContent,IonGrid,IonRow,
    IonCol,IonButton,IonSpinner,IonRefresher,IonRefresherContent,RouterLink,],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="recargar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="hero">
        <img class="hero-logo" src="assets/logo-app.jpg" alt="Logotipo de UrbanInspect" />
        <div>
          <h1>UrbanInspect</h1>
          <p>Reporta y mejora tu ciudad</p>
        </div>
      </div>

      @if (res(); as r) {
        <ion-grid class="stats">
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat stat--pendiente">
                <ion-card-content>
                  <div class="stat-n">{{ r.pendiente }}</div>
                  <div class="stat-l">Pendientes</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat stat--proceso">
                <ion-card-content>
                  <div class="stat-n">{{ r.en_proceso }}</div>
                  <div class="stat-l">En proceso</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat stat--resuelta">
                <ion-card-content>
                  <div class="stat-n">{{ r.resuelta }}</div>
                  <div class="stat-l">Resueltas</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat stat--seguimiento">
                <ion-card-content>
                  <div class="stat-n">{{ seg.codigos().length }}</div>
                  <div class="stat-l">En seguimiento</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      }

      @if (cargando()) {
        <div class="estado-vacio"><ion-spinner></ion-spinner></div>
      }

      @if (error()) {
        <div class="estado-vacio">
          <p>No se pudieron cargar los indicadores.</p>
          <ion-button (click)="cargar()">Reintentar</ion-button>
        </div>
      }

      <div class="acciones">
        <ion-button expand="block" size="large" routerLink="/tabs/nueva">
          Registrar incidencia
        </ion-button>
        <ion-button expand="block" size="large" fill="outline" routerLink="/tabs/incidencias">
          Ver incidencias
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class InicioPage {
  private api = inject(IncidenciasService);
  seg = inject(SeguimientoService);

  res = signal<{ pendiente: number; en_proceso: number; resuelta: number } | null>(null);
  cargando = signal(false);
  error = signal(false);

  // Se ejecuta cada vez que se vuelve a esta pestana: los indicadores se actualizan
  ionViewWillEnter() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set(false);
    try {
      this.res.set(await firstValueFrom(this.api.resumen()));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  async recargar(ev: Event) {
    await this.cargar();
    (ev.target as any).complete();
  }
}
