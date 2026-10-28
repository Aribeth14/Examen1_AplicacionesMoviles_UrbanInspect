import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import {FormBuilder,ReactiveFormsModule,ValidationErrors,ValidatorFn,Validators,} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom, merge } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import {AlertController,IonButton,IonCard,IonCardContent,IonContent,IonHeader,IonInput,IonNote,IonSelect,IonSelectOption,IonSpinner,IonTextarea,IonTitle,IonToolbar,} from '@ionic/angular';
import { CONFIG } from '../config';
import { Clima, Incidencia, Prioridad, TIPOS, Tipo, num } from '../models';
import { BorradorService } from '../services/borrador.service';
import { ClimaService } from '../services/clima.service';
import { ImagenService } from '../services/imagen.service';
import { IncidenciasService } from '../services/incidencias.service';
import { UiService } from '../services/ui.service';

// Reglas que cruzan varios campos: coordenadas (R7) y foto obligatoria con prioridad alta (R5, R6)
const validador: ValidatorFn = g => {
  const v = g.value;
  const e: ValidationErrors = {};
  const lat = String(v.lat ?? '').trim();
  const lng = String(v.lng ?? '').trim();

  if (!lat && !lng) {
    if (v.tipo === 'bache') e['coordsRequeridas'] = true;
  } else if (!lat || !lng) {
    e['coordsIncompletas'] = true;
  } else {
    const a = num(lat);
    const o = num(lng);
    if (isNaN(a) || isNaN(o) || a < -90 || a > 90 || o < -180 || o > 180) {
      e['coordsInvalidas'] = true;
    }
  }

  if (v.prioridad === 'alta' && !v.foto) e['fotoRequerida'] = true;

  return Object.keys(e).length ? e : null;
};

@Component({
  selector: 'app-nueva',
  standalone: true,
  imports: [ReactiveFormsModule,IonHeader,IonToolbar,IonTitle,IonContent,IonInput,IonTextarea,IonSelect,IonSelectOption,IonButton,IonNote,IonSpinner,IonCard,IonCardContent,],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Nueva incidencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div [formGroup]="form">
        <ion-select
          formControlName="tipo"
          label="Tipo *"
          labelPlacement="stacked"
          interface="action-sheet"
          placeholder="Selecciona"
        >
          @for (t of tipos; track t.valor) {
            <ion-select-option [value]="t.valor">{{ t.etiqueta }}</ion-select-option>
          }
        </ion-select>
        @if (intentado() && form.controls.tipo.invalid) {
          <ion-note color="danger">Selecciona el tipo.</ion-note>
        }

        <ion-textarea
          formControlName="descripcion"
          label="Descripción *"
          labelPlacement="stacked"
          rows="3"
        ></ion-textarea>
        @if (intentado() && form.controls.descripcion.invalid) {
          <ion-note color="danger">La descripción es obligatoria.</ion-note>
        }

        <ion-input formControlName="direccion" label="Dirección *" labelPlacement="stacked"></ion-input>
        @if (intentado() && form.controls.direccion.invalid) {
          <ion-note color="danger">La dirección es obligatoria.</ion-note>
        }

        <ion-input formControlName="sector" label="Sector *" labelPlacement="stacked"></ion-input>
        @if (intentado() && form.controls.sector.invalid) {
          <ion-note color="danger">El sector es obligatorio.</ion-note>
        }

        <ion-select
          formControlName="prioridad"
          label="Prioridad *"
          labelPlacement="stacked"
          interface="action-sheet"
        >
          <ion-select-option value="baja">Baja</ion-select-option>
          <ion-select-option value="media">Media</ion-select-option>
          <ion-select-option value="alta">Alta (foto obligatoria)</ion-select-option>
        </ion-select>

        <h3>
          Fotografía
          @if (form.value.prioridad === 'alta') { <small>(obligatoria)</small> }
        </h3>
        @if (form.value.foto) {
          <img [src]="form.value.foto" alt="Vista previa" style="width:100%;border-radius:8px" />
        }
        <ion-button expand="block" size="large" (click)="tomarFoto()">
          {{ form.value.foto ? 'Repetir foto' : 'Tomar foto' }}
        </ion-button>
        @if (form.value.foto) {
          <ion-button expand="block" fill="outline" color="medium" (click)="quitarFoto()">
            Quitar foto
          </ion-button>
        }
        @if (fotoDenegada()) {
          <ion-note color="danger">
            Sin permiso de cámara. Actívalo en los ajustes del teléfono para tomar la foto{{
              form.value.prioridad === 'alta'
                ? ' (sin ella no se puede guardar una incidencia de prioridad alta)'
                : ''
            }}.
          </ion-note>
        }
        @if (intentado() && form.errors?.['fotoRequerida']) {
          <ion-note color="danger">La fotografía es obligatoria para prioridad alta.</ion-note>
        }

        <h3>
          Ubicación
          @if (form.value.tipo === 'bache') { <small>(obligatoria para bache)</small> }
        </h3>
        <ion-button expand="block" size="large" (click)="usarGps()">Usar mi ubicación (GPS)</ion-button>
        @if (gpsError()) {
          <ion-note color="danger">{{ gpsError() }}</ion-note>
        }
        <ion-input
          formControlName="lat"
          label="Latitud"
          labelPlacement="stacked"
          inputmode="decimal"
          placeholder="-0.180653"
        ></ion-input>
        <ion-input
          formControlName="lng"
          label="Longitud"
          labelPlacement="stacked"
          inputmode="decimal"
          placeholder="-78.467834"
        ></ion-input>
        @if (intentado() && form.errors?.['coordsRequeridas']) {
          <ion-note color="danger">
            Para un bache la ubicación es obligatoria: usa el GPS o ingresa coordenadas.
          </ion-note>
        }
        @if (form.errors?.['coordsIncompletas']) {
          <ion-note color="danger">Ingresa latitud y longitud.</ion-note>
        }
        @if (form.errors?.['coordsInvalidas']) {
          <ion-note color="danger">Coordenadas inválidas (latitud -90 a 90, longitud -180 a 180).</ion-note>
        }

        <h3>Clima del lugar</h3>
        <ion-button
          expand="block"
          fill="outline"
          [disabled]="!coords() || climaCargando()"
          (click)="consultarClima()"
        >
          Consultar clima
        </ion-button>
        @if (climaCargando()) {
          <ion-spinner></ion-spinner>
        }
        @if (climaVigente(); as c) {
          <ion-card>
            <ion-card-content>
              <p>Temperatura: <b>{{ c.temperatura }} °C</b></p>
              <p>Precipitación (última hora): <b>{{ c.precipitacion }} mm</b></p>
              <p>Condición: <b>{{ c.descripcion }}</b></p>
              @if (c.precipitacion > umbral) {
                <p>
                  <ion-note color="danger">
                    ADVERTENCIA: lluvia superior a {{ umbral }} mm en la última hora. Las condiciones
                    podrían dificultar el mantenimiento.
                  </ion-note>
                </p>
              }
            </ion-card-content>
          </ion-card>
        }
        @if (climaError()) {
          <ion-note color="warning">{{ climaError() }}</ion-note>
        }

        <ion-button expand="block" size="large" color="success" [disabled]="enviando()" (click)="guardar()">
          {{ enviando() ? 'Guardando...' : 'Guardar incidencia' }}
        </ion-button>
        <ion-button expand="block" fill="clear" color="medium" (click)="limpiar()">
          Descartar formulario
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class NuevaPage {
  private fb = inject(FormBuilder);
  private api = inject(IncidenciasService);
  private climaSrv = inject(ClimaService);
  private imgSrv = inject(ImagenService);
  private borr = inject(BorradorService);
  private ui = inject(UiService);
  private alerta = inject(AlertController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tipos = TIPOS;
  umbral = CONFIG.umbralLluvia;

  intentado = signal(false);
  enviando = signal(false);
  fotoDenegada = signal(false);
  gpsError = signal('');
  clima = signal<Clima | null>(null);
  climaCargando = signal(false);
  climaError = signal('');

  form = this.fb.nonNullable.group(
    {
      tipo: ['' as Tipo | '', Validators.required],
      descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
      direccion: ['', [Validators.required, Validators.pattern(/\S/)]],
      sector: ['', [Validators.required, Validators.pattern(/\S/)]],
      prioridad: ['media' as Prioridad, Validators.required],
      lat: [''],
      lng: [''],
      foto: [''],
    },
    { validators: validador }
  );

  constructor() {
    // R8: el borrador se guarda mientras el usuario escribe
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => {
      if (!this.form.pristine) this.borr.guardar(this.form.getRawValue());
    });

    // Si cambian las coordenadas se limpia el error de clima anterior
    merge(this.form.controls.lat.valueChanges, this.form.controls.lng.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.climaError.set(''));
  }

  async ionViewWillEnter() {
    if (this.borr.restaurar) {
      this.borr.restaurar = false;
      const b = await this.borr.obtener();
      if (b) {
        this.form.patchValue(b); // el clima no se recupera: se vuelve a consultar
        this.cdr.markForCheck();
      }
    }
  }

  // ---------- R6: fotografía ----------
  async tomarFoto() {
    try {
      let p = await Camera.checkPermissions();
      if (p.camera !== 'granted') {
        p = await Camera.requestPermissions({ permissions: ['camera'] });
      }
      if (p.camera !== 'granted') {
        this.fotoDenegada.set(true);
        return;
      }
      this.fotoDenegada.set(false);

      const img = await Camera.getPhoto({
        quality: 50,
        width: 1024,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.form.patchValue({ foto: img.dataUrl ?? '' });
      this.form.markAsDirty();
      this.cdr.markForCheck();
    } catch (e: any) {
      // Si cancela la captura, los demás datos permanecen intactos
      if (/cancel/i.test(e?.message ?? '')) return;
      this.ui.toast('No se pudo capturar la fotografía', 'danger');
    }
  }

  quitarFoto() {
    this.form.patchValue({ foto: '' });
    this.form.markAsDirty();
    this.cdr.markForCheck();
  }

  // ---------- R7: ubicación ----------
  async usarGps() {
    this.gpsError.set('');
    try {
      let p = await Geolocation.checkPermissions();
      if (p.location !== 'granted') p = await Geolocation.requestPermissions();
      if (p.location !== 'granted') {
        this.gpsError.set(
          'Sin acceso al GPS. Ingresa las coordenadas manualmente (ej. -0.180653, -78.467834).'
        );
        return;
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      this.form.patchValue({
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6),
      });
      this.form.markAsDirty();
      this.cdr.markForCheck();
    } catch {
      this.gpsError.set('No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.');
    }
  }

  // Devuelve las coordenadas válidas o null
  coords() {
    const { lat, lng } = this.form.getRawValue();
    if (!String(lat).trim() || !String(lng).trim()) return null;
    const a = num(lat);
    const o = num(lng);
    return isFinite(a) && isFinite(o) && Math.abs(a) <= 90 && Math.abs(o) <= 180
      ? { lat: a, lng: o }
      : null;
  }

  // ---------- R4: clima (solo se muestra si corresponde a las coordenadas actuales) ----------
  climaVigente() {
    const c = this.clima();
    const p = this.coords();
    return c && p && c.lat === p.lat && c.lng === p.lng ? c : null;
  }

  async consultarClima() {
    const p = this.coords();
    if (!p) {
      this.ui.toast('Ingresa coordenadas válidas', 'warning');
      return;
    }
    this.climaCargando.set(true);
    this.climaError.set('');
    this.clima.set(null);
    try {
      this.clima.set(await firstValueFrom(this.climaSrv.consultar(p.lat, p.lng)));
    } catch {
      // Si falla, se informa y se permite continuar
      this.climaError.set('No se pudo obtener el clima. Puedes continuar con el registro.');
    } finally {
      this.climaCargando.set(false);
    }
  }

  // ---------- R5: guardar ----------
  async guardar() {
    this.intentado.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.ui.toast('Revisa los campos marcados', 'danger');
      return;
    }

    if (this.coords()) {
      // El clima se consulta ANTES de guardar
      if (!this.climaVigente()) await this.consultarClima();
      if (!(await this.confirmar())) return;
    }
    await this.enviar();
  }

  private async confirmar() {
    const c = this.climaVigente();
    const msg = c
      ? `Clima: ${c.temperatura} °C - ${c.precipitacion} mm en la última hora - ${c.descripcion}.` +
        (c.precipitacion > this.umbral ? ' ADVERTENCIA: la lluvia podría dificultar el mantenimiento.' : '')
      : 'No se pudo consultar el clima. Puedes continuar.';

    const a = await this.alerta.create({
      header: 'Confirmar registro',
      message: msg,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Registrar', role: 'ok' },
      ],
    });
    await a.present();
    return (await a.onDidDismiss()).role === 'ok';
  }

  private async enviar() {
    if (this.enviando()) return;
    this.enviando.set(true);
    try {
      const v = this.form.getRawValue();
      const p = this.coords();

      // La foto se sube a Cloudinary y en la API se guarda su URL permanente
      const foto = v.foto ? await firstValueFrom(this.imgSrv.subir(v.foto)) : '';

      const nueva: Incidencia = {
        codigo: 'INC-' + Date.now().toString(36).toUpperCase(),
        tipo: v.tipo as Tipo,
        descripcion: v.descripcion.trim(),
        direccion: v.direccion.trim(),
        sector: v.sector.trim(),
        prioridad: v.prioridad,
        estado: 'pendiente',
        fecha: new Date().toISOString(),
        foto,
        lat: p?.lat ?? null,
        lng: p?.lng ?? null,
        observacion: '',
      };

      await firstValueFrom(this.api.crear(nueva));
      await this.borr.limpiar();

      this.form.reset();
      this.clima.set(null);
      this.climaError.set('');
      this.intentado.set(false);
      this.cdr.markForCheck();

      this.ui.toast('Incidencia registrada', 'success');
      this.router.navigateByUrl('/tabs/incidencias');
    } catch {
      // Los datos siguen en el formulario y en el borrador para reintentar
      this.ui.toast('No se pudo registrar. Tus datos siguen guardados, intenta de nuevo.', 'danger');
    } finally {
      this.enviando.set(false);
    }
  }

  async limpiar() {
    await this.borr.limpiar();
    this.form.reset();
    this.clima.set(null);
    this.climaError.set('');
    this.intentado.set(false);
    this.fotoDenegada.set(false);
    this.gpsError.set('');
    this.cdr.markForCheck();
  }
}

