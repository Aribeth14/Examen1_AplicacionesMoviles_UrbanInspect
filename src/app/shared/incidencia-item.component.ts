import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular';
import { COLOR_ESTADO, ETIQUETA_ESTADO, Incidencia, etiquetaTipo } from '../models';
import { SeguimientoService } from '../services/seguimiento.service';

@Component({
  selector: 'app-incidencia-item',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
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
      @if (inc().foto) {
        <img class="inc-foto" [src]="inc().foto" alt="Fotografía de la incidencia" />
      } @else {
        <div class="inc-sinfoto">Sin fotografía</div>
      }
      <ion-card-header>
        <ion-card-subtitle>{{ inc().codigo }} - {{ tipo() }}</ion-card-subtitle>
        <ion-card-title>{{ inc().descripcion }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <dl class="datos">
          <dt>Dirección</dt>
          <dd>{{ inc().direccion }}</dd>
          <dt>Sector</dt>
          <dd>{{ inc().sector }}</dd>
          <dt>Fecha</dt>
          <dd>{{ inc().fecha | date: 'dd/MM/yyyy HH:mm' }}</dd>
        </dl>
        <div class="inc-pie">
          <ion-badge [color]="color()">{{ estado() }}</ion-badge>
          <ion-button
            fill="clear"
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

  // stopPropagation evita que al tocar el marcador se abra el detalle
  marcar(ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    this.seg.alternar(this.inc().codigo);
  }
}
