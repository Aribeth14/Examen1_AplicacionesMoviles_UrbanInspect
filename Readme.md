# 🏙️ UrbanInspect — Gestión & Inspección de Infraestructura Urbana

[![Ionic](https://img.shields.io/badge/Ionic-7.0+-3880FF?style=flat-square&logo=ionic&logoColor=white)](https://ionicframework.com/)
[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.io/)
[![Capacitor](https://img.shields.io/badge/Capacitor-5.0+-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-Academic-blue?style=flat-square)](#)

> **Aplicación Móvil Híbrida para Gestión, Reporte e Inspección Vial y Servicios Urbanos en Tiempo Real**  
> *Desarrollado para la Escuela de Formación de Tecnólogos (ESFOT) — Evaluación Práctica I.*

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Arquitectura & Stack Tecnológico](#-arquitectura--stack-tecnológico)
- [Dependencias & Justificación Técnica](#-dependencias--justificación-técnica)
- [Decisiones de Diseño & Reglas de Negocio](#-decisiones-de-diseño--reglas-de-negocio)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración & Entorno](#-configuración--entorno)
- [Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
- [Flujo de Trabajo Nativo (Android)](#-flujo-de-trabajo-nativo-android)

---

## 🎯 Visión General

**UrbanInspect** es una plataforma móvil diseñada para optimizar el trabajo de campo de inspectores municipales y ciudadanos en el reporte de fallas en infraestructura (baches, luminarias defectuosas, fugas de agua, señalización dañada). 

La aplicación combina **capacidad nativa del dispositivo** (GPS, Cámara y Almacenamiento Seguro) con **servicios externos en tiempo real** (Open-Meteo y Cloudinary) bajo una arquitectura moderna orientada a componentes independientes (*Standalone Component Architecture*).

---

## ✨ Funcionalidades Principales

### 1. 📝 Registro e Inspección en Tiempo Real (`app-nueva`)
- **Categorización Dinámica:** Selección de tipos de incidencia (Bache, Alcantarillado, Señalización, etc.) y niveles de prioridad (*Baja*, *Media*, *Alta*).
- **Captura Nativa de Fotografías:** Integración fluida con la cámara mediante `@capacitor/camera`, vista previa instantánea y subida automática a **Cloudinary**.
- **Geolocalización Automática:** Obtención de coordenadas decimales (latitud y longitud) con alta precisión vía `@capacitor/geolocation` o ingreso manual.
- **Validación Meteorológica Activa:** Integración con la API de **Open-Meteo** para analizar condiciones climáticas en las coordenadas especificadas y prever dificultades de mantenimiento por lluvia acumulada.
- **Auto-guardado de Borrador (R8):** Sincronización continua en segundo plano usando `@capacitor/preferences` para no perder la información en caso de cierre inesperado.

### 2. 📋 Listado Dinámico de Incidencias (`app-incidencias`)
- **Paginación Remota Eficiente:** Carga por demanda (*Infinite Scroll*) conectada a la API remota en MockAPI.
- **Actualización Gestual:** Recarga por arrastre (*Pull-to-Refresh*) para consultar nuevos datos.
- **Actualización Automática al Regresar (R10):** Sincronización transparente de la lista en el ciclo de vida `ionViewWillEnter`.

### 3. 🔍 Seguimiento Personalizado (`app-seguimiento`)
- **Marcado Local Persistente (R1):** Permite a los usuarios marcar incidencias de interés para realizar seguimiento específico.
- **Consulta Agrupada:** Peticiones concurrentes con `RxJS forkJoin` para consultar el estado actualizado de todas las incidencias marcadas.
- **Eliminación en Tiempo Real:** Remoción instantánea de la vista cuando una incidencia se desmarca.

---

## 🛠️ Arquitectura & Stack Tecnológico

* **Framework Base:** Ionic Framework + Angular (v17+)
* **Patrón de Arquitectura:** Standalone Components + Signals + Service Layer Pattern
* **Gestión de Estado Reactivo:** Angular Signals (`signal`, `computed`) + RxJS (`debounceTime`, `firstValueFrom`, `merge`)
* **Capa Nativa:** Capacitor (Android / iOS)
* **Validación de Formularios:** Reactive Forms con validador personalizado a nivel de grupo (`ValidatorFn`)
* **Estilos:** SCSS con paleta de colores personalizada de tonos **Azules y Celestes**, diseño responsivo adaptable.

---

## 📦 Dependencias & Justificación Técnica

| Paquete / Servicio | Versión / Tipo | Propósito y Justificación Técnica |
| :--- | :--- | :--- |
| **`@capacitor/camera`** | Nativo | **Requisito R6:** Permite la toma directa de fotografías con compresión e integración de cámara nativa. |
| **`@capacitor/geolocation`** | Nativo | **Requisito R7:** Permite obtener las coordenadas exactas de la incidencia usando sensores GPS del hardware. |
| **`@capacitor/preferences`** | Nativo / Local | **Requisitos R1 y R8:** Almacenamiento seguro clave-valor para guardar el borrador activo y los códigos de incidencias en seguimiento. |
| **MockAPI** | Backend Remoto | Servidor de prueba para el recurso `incidencias` con soporte de parámetros de paginación `page` y `limit`. |
| **Open-Meteo API** | REST API | Consulta meteorológica en tiempo real sin requerir API Key. Obtiene datos meteorológicos y calcula la precipitación en la última hora. |
| **Cloudinary** | CDN / Cloud | Subida e independización de almacenamiento de imágenes usando *Unsigned Upload Presets*, guardando solo la URL resultante. |

---

## ⚙️ Decisiones de Diseño & Reglas de Negocio

1. **Paginación del Lado del Servidor:**
   - La lista de incidencias solicita bloques de datos por página. Se detecta el fin de registros cuando la API devuelve una colección vacía o menor al límite configurado (`CONFIG.pagina`).
2. **Validación Cruzada de Formularios:**
   - **Baches:** Requieren obligatoriamente coordenadas de ubicación (GPS o manuales).
   - **Prioridad Alta:** Exige la captura obligatoria de una fotografía antes de permitir el envío.
3. **Manejo del Clima Basado en Coordenadas:**
   - La información del clima expira automáticamente si el usuario altera la latitud o la longitud en el formulario. Se evitan datos falsos o simulados (*no mock data for weather*).
4. **Respeto a la Voz y Privacidad de Datos:**
   - Las claves de API y configuraciones del entorno se gestionan fuera del control de versiones centralizado mediante `src/app/config.ts`.

---

## 📂 Estructura del Proyecto

```text
src/
└── app/
    ├── config.ts                    # Variables de entorno y endpoints de la API
    ├── models/
    │   └── index.ts                 # Interfaces (Incidencia, Clima, Prioridad, Tipo)
    ├── services/
    │   ├── borrador.service.ts      # Manejo de borrador persistente (Preferences)
    │   ├── clima.service.ts         # Integración con Open-Meteo API
    │   ├── imagen.service.ts        # Subida de imágenes a Cloudinary
    │   ├── incidencias.service.ts   # CRUD y paginación con MockAPI
    │   ├── seguimiento.service.ts  # Control de incidencias marcadas
    │   └── ui.service.ts           # Notificaciones Toast y alertas
    ├── pages/
    │   ├── nueva.page.ts            # Formulario de registro con fotos y GPS
    │   ├── incidencias.page.ts      # Listado global con infinite scroll
    │   └── seguimiento.page.ts      # Listado de incidencias marcadas
    └── shared/
        └── incidencia-item.component.ts # Componente de tarjeta de incidencia
```

---

## 🔧 Configuración & Entorno

Crea o verifica el archivo `src/app/config.ts` con la siguiente estructura de variables:

```typescript
export const CONFIG = {
  apiIncidencias: 'https://TU-SUBDOMINIO.mockapi.io/api/v1/incidencias',
  cloudinaryUrl: 'https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload',
  cloudinaryPreset: 'TU_UNSIGNED_PRESET',
  umbralLluvia: 2.0, // Umbral en mm para alertas de lluvia
  pagina: 10         # Cantidad de ítems por página
};
```

---

## 🚀 Guía de Instalación y Ejecución

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/urban-inspect.git
cd urban-inspect
npm install
```

### 2. Ejecutar en entorno Web (Desarrollo)

```bash
npx ionic serve
```

La aplicación se abrirá en `http://localhost:8100/`.

---

## 📱 Flujo de Trabajo Nativo (Android)

### 1. Compilar aplicación Web
```bash
npx ionic build
```

### 2. Sincronizar plugins y código nativo
```bash
npx cap sync android
```

### 3. Abrir en Android Studio
```bash
npx cap open android
```

> **Nota:** Para ejecutar en un dispositivo físico o emulador Android, asegúrate de otorgar los permisos de **Cámara** y **Ubicación GPS** cuando la aplicación lo solicite en pantalla.

---

## 📄 Créditos & Licencia

Desarrollado como proyecto de evaluación técnica para **ESFOT**. Todos los derechos reservados.