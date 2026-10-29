import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular';
import { COLOR_ESTADO, ETIQUETA_ESTADO, type Incidencia, etiquetaTipo } from '../models';
import { SeguimientoService } from '../services/seguimiento.service';

@Component({
  selector: 'app-incidencia-item',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonButton,
    IonIcon,
    RouterLink,
    DatePipe,
  ],
  template: `
    <ion-card class="inc" [routerLink]="['/detalle', inc().id]">
      <div class="inc-foto-container">
        @if (inc().foto) {
          <img class="inc-foto" [src]="inc().foto" alt="Fotografía de la incidencia" />
        } @else {
          <div class="inc-sinfoto">
            <ion-icon name="image-outline"></ion-icon>
            <span>Sin fotografía adjunta</span>
          </div>
        }
      </div>

      <div class="inc-header-chips">
        <span class="inc-type-tag">
          <ion-icon [name]="iconoTipo()"></ion-icon>
          {{ tipo() }}
        </span>
        <span class="inc-codigo-tag">{{ inc().codigo }}</span>
      </div>

      <ion-card-header>
        <ion-card-title>{{ inc().descripcion }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <dl class="datos">
          <dt>
            <ion-icon name="location-outline"></ion-icon>
            Dirección
          </dt>
          <dd>{{ inc().direccion }}</dd>

          <dt>
            <ion-icon name="business-outline"></ion-icon>
            Sector
          </dt>
          <dd>{{ inc().sector }}</dd>

          <dt>
            <ion-icon name="calendar-outline"></ion-icon>
            Fecha
          </dt>
          <dd>{{ inc().fecha | date: 'dd/MM/yyyy HH:mm' }}</dd>
        </dl>

        <div class="inc-pie">
          <ion-badge [color]="color()">{{ estado() }}</ion-badge>
          <ion-button
            fill="clear"
            class="inc-bookmark-btn"
            aria-label="Marcar para seguimiento"
            (click)="marcar($event)"
          >
            <ion-icon
              slot="icon-only"
              [name]="seg.esMarcada(inc().codigo) ? 'bookmark' : 'bookmark-outline'"
            ></ion-icon>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
})
export class IncidenciaItemComponent {
  inc = input.required<Incidencia>();
  seg = inject(SeguimientoService);

  tipo = computed(() => etiquetaTipo(this.inc().tipo));
  estado = computed(() => ETIQUETA_ESTADO[this.inc().estado]);
  color = computed(() => COLOR_ESTADO[this.inc().estado]);

  iconoTipo = computed(() => {
    switch (this.inc().tipo) {
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

  // stopPropagation evita que al tocar el marcador se abra el detalle
  marcar(ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    this.seg.alternar(this.inc().codigo);
  }
}
