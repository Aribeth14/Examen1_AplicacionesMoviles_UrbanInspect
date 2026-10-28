import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UiService {
  private t = inject(ToastController);

  async toast(message: string, color = 'dark') {
    const t = await this.t.create({ message, color, duration: 3500, position: 'top' });
    await t.present();
  }
}
