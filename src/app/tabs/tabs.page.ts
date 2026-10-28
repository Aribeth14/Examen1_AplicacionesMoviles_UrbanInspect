import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
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
        </ion-tab-button>
        <ion-tab-button tab="nueva">
          <ion-icon name="add-circle-outline"></ion-icon>
          <ion-label>Nueva</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {}
