import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {IonBackButton,IonBadge,IonButton,IonButtons,IonContent,IonHeader,IonIcon,IonNote,IonSelect,
  IonSelectOption,IonSpinner,IonTextarea,IonTitle,IonToolbar,} from '@ionic/angular';
import { COLOR_ESTADO, ETIQUETA_ESTADO, Estado, Incidencia, TRANSICIONES, etiquetaTipo } from '../models';
import { IncidenciasService } from '../services/incidencias.service';
import { SeguimientoService } from '../services/seguimiento.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [FormsModule,DatePipe,IonHeader,IonToolbar,IonTitle,IonButtons,
    IonBackButton,IonButton,IonIcon,IonContent,IonBadge,IonSelect,IonSelectOption,
    IonTextarea,IonNote,IonSpinner,],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/incidencias"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle</ion-title>
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
        <div class="estado-vacio"><ion-spinner></ion-spinner></div>
      }

      @if (error()) {
        <div class="estado-vacio">
          <p>No se pudo cargar la incidencia.</p>
          <ion-button (click)="cargar()">Reintentar</ion-button>
        </div>
      }

      @if (inc(); as i) {
        @if (i.foto) {
          <img class="detalle-foto" [src]="i.foto" alt="Fotografía de la incidencia" />
        } @else {
          <div class="detalle-sinfoto">Sin fotografía</div>
        }

        <div class="pagina">
          <div class="detalle-cabecera">
            <h2>{{ i.codigo }}</h2>
            <ion-badge [color]="colorEstado[i.estado]">{{ etiquetaEstado[i.estado] }}</ion-badge>
          </div>

          <section class="panel">
            <dl class="datos">
              <dt>Tipo</dt>
              <dd>{{ tipo() }}</dd>
              <dt>Descripción</dt>
              <dd>{{ i.descripcion }}</dd>
              <dt>Dirección</dt>
              <dd>{{ i.direccion }}</dd>
              <dt>Sector</dt>
              <dd>{{ i.sector }}</dd>
              <dt>Prioridad</dt>
              <dd class="capitalizar">{{ i.prioridad }}</dd>
              <dt>Fecha</dt>
              <dd>{{ i.fecha | date: 'dd/MM/yyyy HH:mm' }}</dd>
              @if (i.lat !== null && i.lng !== null) {
                <dt>Coordenadas</dt>
                <dd>{{ i.lat }}, {{ i.lng }}</dd>
              }
              @if (i.observacion) {
                <dt>Observación</dt>
                <dd>{{ i.observacion }}</dd>
              }
            </dl>
          </section>

          <section class="panel">
            <h3 class="panel-titulo">Cambio de estado</h3>
            @if (permitidos().length) {
              <ion-select
                class="campo"
                fill="outline"
                label="Nuevo estado"
                labelPlacement="stacked"
                interface="action-sheet"
                placeholder="Selecciona"
                [(ngModel)]="nuevo"
              >
                @for (e of permitidos(); track e) {
                  <ion-select-option [value]="e">{{ etiquetaEstado[e] }}</ion-select-option>
                }
              </ion-select>

              @if (nuevo === 'resuelta') {
                <ion-textarea
                  class="campo"
                  fill="outline"
                  label="Observación (obligatoria)"
                  labelPlacement="stacked"
                  [(ngModel)]="obs"
                  [counter]="true"
                  maxlength="300"
                ></ion-textarea>
              }

              <ion-button expand="block" size="large" [disabled]="!nuevo || guardando()" (click)="actualizar()">
                Actualizar estado
              </ion-button>
            } @else {
              <ion-note>Incidencia resuelta: no admite más cambios de estado.</ion-note>
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
