import { Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { SeguimientoService } from '../services/seguimiento.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="incidencias">
          <ion-icon name="list-outline"></ion-icon>
          <ion-label>Incidencias</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="seguimiento">
          <ion-icon name="bookmark-outline"></ion-icon>
          <ion-label>Seguimiento</ion-label>
          @if (seg.codigos().length > 0) {
            <ion-badge color="primary">{{ seg.codigos().length }}</ion-badge>
          }
        </ion-tab-button>
        <ion-tab-button tab="nueva">
          <ion-icon name="add-circle-outline"></ion-icon>
          <ion-label>Nueva</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  seg = inject(SeguimientoService);
}
