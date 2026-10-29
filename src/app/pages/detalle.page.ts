import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import {
  COLOR_ESTADO,
  ETIQUETA_ESTADO,
  type Estado,
  type Incidencia,
  TRANSICIONES,
  etiquetaTipo,
} from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/incidencias" text="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle de Incidencia</ion-title>
        @if (inc(); as i) {
          <ion-buttons slot="end">
            <ion-button (click)="seg.alternar(i.codigo)" aria-label="Seguimiento">
              <ion-icon
                slot="icon-only"
                [name]="seg.esMarcada(i.codigo) ? 'bookmark' : 'bookmark-outline'"
              ></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando()) {
        <div class="estado-vacio">
          <ion-spinner color="primary"></ion-spinner>
          <p class="estado-vacio-desc" style="margin-top: 10px;">Cargando información...</p>
        </div>
      }

      @if (error()) {
        <div class="estado-vacio">
          <ion-icon name="alert-circle-outline" class="estado-vacio-icon" color="danger"></ion-icon>
          <h3 class="estado-vacio-title">Error al cargar</h3>
          <p class="estado-vacio-desc">No se pudo cargar la información de la incidencia.</p>
          <ion-button fill="outline" color="primary" (click)="cargar()">
            <ion-icon slot="start" name="refresh-outline"></ion-icon>
            Reintentar
          </ion-button>
        </div>
      }

      @if (inc(); as i) {
        <div class="detalle-hero">
          @if (i.foto) {
            <img class="detalle-foto" [src]="i.foto" alt="Fotografía de la incidencia" />
          } @else {
            <div class="detalle-sinfoto">
              <ion-icon name="image-outline"></ion-icon>
              <span>Sin fotografía adjunta</span>
            </div>
          }
        </div>

        <div class="app-container">
          <section class="panel">
            <div class="detalle-cabecera">
              <div>
                <h2 class="detalle-codigo">{{ i.codigo }}</h2>
                <span class="inc-type-tag" style="margin-top: 4px;">
                  <ion-icon [name]="iconoTipo()"></ion-icon>
                  {{ tipo() }}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <ion-badge [color]="colorEstado[i.estado]">{{ etiquetaEstado[i.estado] }}</ion-badge>
                <small style="color: var(--brand-text-secondary); font-weight: 600;">
                  Prioridad <b class="capitalizar">{{ i.prioridad }}</b>
                </small>
              </div>
            </div>

            <div class="detalle-descripcion-box">
              {{ i.descripcion }}
            </div>

            <dl class="datos">
              <dt>
                <ion-icon name="location-outline"></ion-icon>
                Dirección
              </dt>
              <dd>{{ i.direccion }}</dd>

              <dt>
                <ion-icon name="business-outline"></ion-icon>
                Sector
              </dt>
              <dd>{{ i.sector }}</dd>

              <dt>
                <ion-icon name="calendar-outline"></ion-icon>
                Fecha
              </dt>
              <dd>{{ i.fecha | date: 'dd/MM/yyyy HH:mm' }}</dd>

              @if (i.lat !== null && i.lng !== null) {
                <dt>
                  <ion-icon name="navigate-outline"></ion-icon>
                  Coordenadas
                </dt>
                <dd>{{ i.lat }}, {{ i.lng }}</dd>
              }
            </dl>

            @if (i.observacion) {
              <div class="detalle-observacion-box">
                <b style="display: block; margin-bottom: 2px;">Observación de cierre:</b>
                {{ i.observacion }}
              </div>
            }
          </section>

          <section class="panel">
            <div class="panel-header">
              <div class="panel-header-icon">
                <ion-icon name="construct-outline"></ion-icon>
              </div>
              <div>
                <h3 class="panel-title">Gestión de Estado</h3>
                <p class="panel-subtitle">Actualizar el flujo de atención del reporte</p>
              </div>
            </div>

            @if (permitidos().length) {
              <div class="campo">
                <ion-select
                  fill="outline"
                  label="Nuevo estado"
                  labelPlacement="stacked"
                  interface="action-sheet"
                  placeholder="Seleccionar nuevo estado"
                  [(ngModel)]="nuevo"
                >
                  @for (e of permitidos(); track e) {
                    <ion-select-option [value]="e">{{ etiquetaEstado[e] }}</ion-select-option>
                  }
                </ion-select>
              </div>

              @if (nuevo === 'resuelta') {
                <div class="campo">
                  <ion-textarea
                    fill="outline"
                    label="Observación (obligatoria para resolver)"
                    labelPlacement="stacked"
                    placeholder="Detalla los trabajos o solución aplicada..."
                    [(ngModel)]="obs"
                    [counter]="true"
                    maxlength="300"
                    rows="3"
                  ></ion-textarea>
                </div>
              }

              <ion-button
                expand="block"
                size="large"
                color="primary"
                [disabled]="!nuevo || guardando()"
                (click)="actualizar()"
              >
                <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
                {{ guardando() ? 'Guardando cambios...' : 'Actualizar estado' }}
              </ion-button>
            } @else {
              <div class="detalle-resuelto-banner">
                <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                <span>Incidencia resuelta. No admite más cambios de estado.</span>
              </div>
            }
          </section>
        </div>
      }
    </ion-content>
  `,
})
export class DetallePage {
  private api = inject(IncidenciasService);
  private ui = inject(UiService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  seg = inject(SeguimientoService);

  etiquetaEstado = ETIQUETA_ESTADO;
  colorEstado = COLOR_ESTADO;

  inc = signal<Incidencia | null>(null);
  cargando = signal(false);
  error = signal(false);
  guardando = signal(false);

  nuevo: Estado | null = null;
  obs = '';

  // Solo se ofrecen los estados permitidos desde el estado actual (R9)
  permitidos = computed(() => (this.inc() ? TRANSICIONES[this.inc()!.estado] : []));
  tipo = computed(() => (this.inc() ? etiquetaTipo(this.inc()!.tipo) : ''));

  iconoTipo = computed(() => {
    const t = this.inc()?.tipo;
    switch (t) {
      case 'luminaria':
        return 'bulb-outline';
      case 'bache':
        return 'warning-outline';
      case 'senalizacion':
        return 'navigate-outline';
      case 'alcantarilla':
        return 'water-outline';
      case 'parque':
        return 'leaf-outline';
      default:
        return 'information-circle-outline';
    }
  });

  ionViewWillEnter() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set(false);
    try {
      this.inc.set(await firstValueFrom(this.api.obtener(this.id)));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  async actualizar() {
    const i = this.inc();
    if (!i || !this.nuevo) return;

    if (this.nuevo === 'resuelta' && !this.obs.trim()) {
      this.ui.toast('La observación es obligatoria para marcar como resuelta', 'danger');
      return;
    }

    this.guardando.set(true);
    try {
      this.inc.set(await firstValueFrom(this.api.cambiarEstado(i.id!, this.nuevo, this.obs)));
      this.nuevo = null;
      this.obs = '';
      this.ui.toast('Estado actualizado', 'success');
    } catch (e: any) {
      // Error nuestro (regla de negocio) trae mensaje propio; error de red no trae status nuestro
      this.ui.toast(
        e?.message && !e?.status ? e.message : 'No se pudo actualizar. Revisa tu conexión.',
        'danger'
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
