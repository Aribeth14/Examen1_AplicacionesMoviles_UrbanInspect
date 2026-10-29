import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircle,
  addCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  bookmark,
  bookmarkOutline,
  bulbOutline,
  businessOutline,
  calendarOutline,
  cameraOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkDoneCircle,
  checkmarkDoneCircleOutline,
  checkmarkOutline,
  chevronForwardOutline,
  closeCircleOutline,
  cloudOutline,
  construct,
  constructOutline,
  flashlightOutline,
  home,
  homeOutline,
  imageOutline,
  informationCircleOutline,
  leafOutline,
  list,
  listOutline,
  locationOutline,
  navigateOutline,
  rainyOutline,
  refreshOutline,
  sunnyOutline,
  thermometerOutline,
  time,
  timeOutline,
  trashOutline,
  warningOutline,
  waterOutline,
} from 'ionicons/icons';
import { BorradorService } from './services/borrador.service';
import { SeguimientoService } from './services/seguimiento.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private seg = inject(SeguimientoService);
  private borr = inject(BorradorService);
  private alerta = inject(AlertController);
  private router = inject(Router);

  constructor() {
    // Registro de los iconos que usa la app
    addIcons({
      home,
      homeOutline,
      list,
      listOutline,
      bookmark,
      bookmarkOutline,
      addCircle,
      addCircleOutline,
      time,
      timeOutline,
      construct,
      constructOutline,
      checkmarkDoneCircle,
      checkmarkDoneCircleOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      checkmarkOutline,
      alertCircleOutline,
      warningOutline,
      locationOutline,
      businessOutline,
      calendarOutline,
      cameraOutline,
      imageOutline,
      trashOutline,
      refreshOutline,
      navigateOutline,
      cloudOutline,
      sunnyOutline,
      thermometerOutline,
      rainyOutline,
      informationCircleOutline,
      arrowForwardOutline,
      bulbOutline,
      leafOutline,
      waterOutline,
      closeCircleOutline,
      chevronForwardOutline,
      flashlightOutline,
    });
  }

  async ngOnInit() {
    // R1: se carga la lista de seguimiento guardada en el telefono
    await this.seg.init();

    // R8: si quedo un registro incompleto, se ofrece continuar o descartar
    if (await this.borr.obtener()) {
      const a = await this.alerta.create({
        header: 'Registro incompleto',
        message: 'Tienes un registro sin terminar. ¿Deseas continuar o descartarlo?',
        backdropDismiss: false,
        buttons: [
          { text: 'Descartar', role: 'descartar' },
          { text: 'Continuar', role: 'continuar' },
        ],
      });
      await a.present();
      const { role } = await a.onDidDismiss();

      if (role === 'continuar') {
        this.borr.restaurar = true;
        this.router.navigateByUrl('/tabs/nueva');
      } else {
        await this.borr.limpiar();
      }
    }
  }
}