import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom, merge } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CONFIG } from '../config';
import { type Clima, type Incidencia, type Prioridad, TIPOS, type Tipo, num } from '../models';
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
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nueva Incidencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="app-container" [formGroup]="form">
        <!-- Tarjeta 1: Información General -->
        <section class="panel">
          <div class="panel-header">
            <div class="panel-header-icon">
              <ion-icon name="information-circle-outline"></ion-icon>
            </div>
            <div>
              <h3 class="panel-title">Información del Reporte</h3>
              <p class="panel-subtitle">Detalles principales del problema urbano</p>
            </div>
          </div>

          <div class="campo">
            <ion-select
              formControlName="tipo"
              label="Tipo de incidencia *"
              labelPlacement="stacked"
              fill="outline"
              interface="action-sheet"
              placeholder="Selecciona el tipo"
            >
              @for (t of tipos; track t.valor) {
                <ion-select-option [value]="t.valor">{{ t.etiqueta }}</ion-select-option>
              }
            </ion-select>
            @if (intentado() && form.controls.tipo.invalid) {
              <div class="aviso-error">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>Selecciona el tipo de incidencia.</span>
              </div>
            }
          </div>

          <div class="campo">
            <ion-textarea
              formControlName="descripcion"
              label="Descripción detallada *"
              labelPlacement="stacked"
              fill="outline"
              placeholder="Describe lo sucedido o el daño observado..."
              rows="3"
            ></ion-textarea>
            @if (intentado() && form.controls.descripcion.invalid) {
              <div class="aviso-error">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>La descripción es obligatoria.</span>
              </div>
            }
          </div>

          <div class="campo">
            <ion-input
              formControlName="direccion"
              label="Dirección aproximada *"
              labelPlacement="stacked"
              fill="outline"
              placeholder="Ej. Calle Los Álamos y Av. Principal"
            ></ion-input>
            @if (intentado() && form.controls.direccion.invalid) {
              <div class="aviso-error">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>La dirección es obligatoria.</span>
              </div>
            }
          </div>

          <div class="campo">
            <ion-input
              formControlName="sector"
              label="Sector o barrio *"
              labelPlacement="stacked"
              fill="outline"
              placeholder="Ej. La Floresta / Centro Histórico"
            ></ion-input>
            @if (intentado() && form.controls.sector.invalid) {
              <div class="aviso-error">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>El sector es obligatorio.</span>
              </div>
            }
          </div>

          <div class="campo">
            <ion-select
              formControlName="prioridad"
              label="Nivel de prioridad *"
              labelPlacement="stacked"
              fill="outline"
              interface="action-sheet"
            >
              <ion-select-option value="baja">Baja</ion-select-option>
              <ion-select-option value="media">Media</ion-select-option>
              <ion-select-option value="alta">Alta (requiere fotografía obligatoria)</ion-select-option>
            </ion-select>
          </div>
        </section>

        <!-- Tarjeta 2: Evidencia Fotográfica -->
        <section class="panel">
          <div class="panel-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="panel-header-icon">
                <ion-icon name="camera-outline"></ion-icon>
              </div>
              <div>
                <h3 class="panel-title">Evidencia Fotográfica</h3>
                <p class="panel-subtitle">Captura imagen del estado actual</p>
              </div>
            </div>
            @if (form.value.prioridad === 'alta') {
              <ion-badge color="danger">Obligatoria</ion-badge>
            }
          </div>

          @if (form.value.foto) {
            <div class="foto-previa-wrap">
              <img [src]="form.value.foto" alt="Vista previa" class="foto-previa" />
            </div>
            <div class="fila-2">
              <ion-button expand="block" fill="outline" color="primary" (click)="tomarFoto()">
                <ion-icon slot="start" name="camera-outline"></ion-icon>
                Repetir foto
              </ion-button>
              <ion-button expand="block" fill="outline" color="medium" (click)="quitarFoto()">
                <ion-icon slot="start" name="trash-outline"></ion-icon>
                Quitar foto
              </ion-button>
            </div>
          } @else {
            <div class="foto-caja" (click)="tomarFoto()">
              <ion-icon name="camera-outline" class="foto-caja-icon"></ion-icon>
              <p class="foto-caja-text">Toca para tomar una fotografía</p>
            </div>
            <ion-button expand="block" color="primary" (click)="tomarFoto()">
              <ion-icon slot="start" name="camera-outline"></ion-icon>
              Tomar fotografía
            </ion-button>
          }

          @if (fotoDenegada()) {
            <div class="aviso-error" style="margin-top: 10px;">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>Sin permiso de cámara. Habilítalo en ajustes para tomar la fotografía.</span>
            </div>
          }
          @if (intentado() && form.errors?.['fotoRequerida']) {
            <div class="aviso-error" style="margin-top: 10px;">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>La fotografía es obligatoria para incidencias de prioridad alta.</span>
            </div>
          }
        </section>

        <!-- Tarjeta 3: Ubicación Geográfica -->
        <section class="panel">
          <div class="panel-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="panel-header-icon">
                <ion-icon name="location-outline"></ion-icon>
              </div>
              <div>
                <h3 class="panel-title">Ubicación Geográfica</h3>
                <p class="panel-subtitle">Coordenadas del incidente</p>
              </div>
            </div>
            @if (form.value.tipo === 'bache') {
              <ion-badge color="warning">Obligatoria</ion-badge>
            }
          </div>

          <ion-button expand="block" fill="outline" color="primary" style="margin-bottom: 14px;" (click)="usarGps()">
            <ion-icon slot="start" name="navigate-outline"></ion-icon>
            Obtener mi ubicación (GPS)
          </ion-button>

          @if (gpsError()) {
            <div class="aviso-error" style="margin-bottom: 12px;">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>{{ gpsError() }}</span>
            </div>
          }

          <div class="fila-2">
            <div class="campo">
              <ion-input
                formControlName="lat"
                label="Latitud"
                labelPlacement="stacked"
                fill="outline"
                inputmode="decimal"
                placeholder="-0.180653"
              ></ion-input>
            </div>
            <div class="campo">
              <ion-input
                formControlName="lng"
                label="Longitud"
                labelPlacement="stacked"
                fill="outline"
                inputmode="decimal"
                placeholder="-78.467834"
              ></ion-input>
            </div>
          </div>

          @if (intentado() && form.errors?.['coordsRequeridas']) {
            <div class="aviso-error">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>Para un bache las coordenadas son obligatorias: usa GPS o ingrésalas manualmente.</span>
            </div>
          }
          @if (form.errors?.['coordsIncompletas']) {
            <div class="aviso-error">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>Ingresa tanto latitud como longitud.</span>
            </div>
          }
          @if (form.errors?.['coordsInvalidas']) {
            <div class="aviso-error">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>Coordenadas fuera de rango válido (-90 a 90, -180 a 180).</span>
            </div>
          }
        </section>

        <!-- Tarjeta 4: Verificación Climática -->
        <section class="panel">
          <div class="panel-header">
            <div class="panel-header-icon">
              <ion-icon name="cloud-outline"></ion-icon>
            </div>
            <div>
              <h3 class="panel-title">Condición Climática</h3>
              <p class="panel-subtitle">Verifica el clima en la zona reportada</p>
            </div>
          </div>

          <ion-button
            expand="block"
            fill="outline"
            color="primary"
            [disabled]="!coords() || climaCargando()"
            (click)="consultarClima()"
          >
            <ion-icon slot="start" name="cloud-outline"></ion-icon>
            {{ climaCargando() ? 'Consultando estación...' : 'Consultar clima del lugar' }}
          </ion-button>

          @if (climaCargando()) {
            <div class="estado-vacio" style="padding: 16px;">
              <ion-spinner color="primary"></ion-spinner>
            </div>
          }

          @if (climaVigente(); as c) {
            <div class="clima-card">
              <div class="clima-header">
                <ion-icon name="sunny-outline"></ion-icon>
                <span>Reporte Meteorológico Actual</span>
              </div>
              <div class="clima-grid">
                <div class="clima-item">
                  <div class="clima-item-valor">{{ c.temperatura }} °C</div>
                  <div class="clima-item-label">Temperatura</div>
                </div>
                <div class="clima-item">
                  <div class="clima-item-valor">{{ c.precipitacion }} mm</div>
                  <div class="clima-item-label">Precipitación</div>
                </div>
                <div class="clima-item">
                  <div class="clima-item-valor" style="font-size: 0.95rem;">{{ c.descripcion }}</div>
                  <div class="clima-item-label">Condición</div>
                </div>
              </div>

              @if (c.precipitacion > umbral) {
                <div class="aviso-lluvia">
                  <ion-icon name="warning-outline"></ion-icon>
                  <span>
                    ADVERTENCIA: lluvia superior a {{ umbral }} mm en la última hora. Las condiciones
                    podrían dificultar las labores de mantenimiento.
                  </span>
                </div>
              }
            </div>
          }

          @if (climaError()) {
            <div class="aviso-error" style="margin-top: 10px; background: #fffbeb; color: #b45309;">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>{{ climaError() }}</span>
            </div>
          }
        </section>

        <!-- Acciones finales -->
        <div style="margin-top: 10px; margin-bottom: 24px;">
          <ion-button
            expand="block"
            size="large"
            color="success"
            [disabled]="enviando()"
            (click)="guardar()"
          >
            <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
            {{ enviando() ? 'Guardando reporte...' : 'Guardar incidencia' }}
          </ion-button>

          <ion-button expand="block" fill="clear" color="medium" style="margin-top: 8px;" (click)="limpiar()">
            <ion-icon slot="start" name="trash-outline"></ion-icon>
            Descartar formulario
          </ion-button>
        </div>
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
