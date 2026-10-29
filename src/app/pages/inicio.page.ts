import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    RouterLink,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>UrbanInspect</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="recargar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="hero">
        <div class="hero-content">
          <div class="hero-logo-box">
            <img class="hero-logo" src="assets/icon/logo.jpg" alt="Logotipo de UrbanInspect" />
          </div>
          <div class="hero-text">
            <div class="hero-tag">Gestión Ciudadana</div>
            <h1>UrbanInspect</h1>
            <p>Reporta y mejora tu ciudad</p>
          </div>
        </div>
      </div>

      @if (res(); as r) {
        <ion-grid class="stats">
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat stat--pendiente">
                <ion-card-content>
                  <div class="stat-header">
                    <div class="stat-n">{{ r.pendiente }}</div>
                    <div class="stat-icon">
                      <ion-icon name="time-outline"></ion-icon>
                    </div>
                  </div>
                  <div class="stat-l">Pendientes</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat stat--proceso">
                <ion-card-content>
                  <div class="stat-header">
                    <div class="stat-n">{{ r.en_proceso }}</div>
                    <div class="stat-icon">
                      <ion-icon name="construct-outline"></ion-icon>
                    </div>
                  </div>
                  <div class="stat-l">En proceso</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat stat--resuelta">
                <ion-card-content>
                  <div class="stat-header">
                    <div class="stat-n">{{ r.resuelta }}</div>
                    <div class="stat-icon">
                      <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                    </div>
                  </div>
                  <div class="stat-l">Resueltas</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat stat--seguimiento">
                <ion-card-content>
                  <div class="stat-header">
                    <div class="stat-n">{{ seg.codigos().length }}</div>
                    <div class="stat-icon">
                      <ion-icon name="bookmark-outline"></ion-icon>
                    </div>
                  </div>
                  <div class="stat-l">En seguimiento</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      }

      @if (cargando()) {
        <div class="estado-vacio">
          <ion-spinner color="primary"></ion-spinner>
          <p class="estado-vacio-desc" style="margin-top: 10px;">Actualizando indicadores...</p>
        </div>
      }

      @if (error()) {
        <div class="estado-vacio">
          <ion-icon name="alert-circle-outline" class="estado-vacio-icon" color="danger"></ion-icon>
          <h3 class="estado-vacio-title">Error de conexión</h3>
          <p class="estado-vacio-desc">No se pudieron cargar los indicadores municipales.</p>
          <ion-button fill="outline" color="primary" (click)="cargar()">
            <ion-icon slot="start" name="refresh-outline"></ion-icon>
            Reintentar
          </ion-button>
        </div>
      }

      <div class="acciones">
        <div class="acciones-titulo">Acciones principales</div>
        <ion-button expand="block" size="large" color="primary" routerLink="/tabs/nueva">
          <ion-icon slot="start" name="add-circle-outline"></ion-icon>
          Registrar incidencia
        </ion-button>
        <ion-button expand="block" size="large" fill="outline" color="primary" routerLink="/tabs/incidencias">
          <ion-icon slot="start" name="list-outline"></ion-icon>
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
