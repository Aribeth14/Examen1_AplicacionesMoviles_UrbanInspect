import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { CONFIG } from '../config';

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private http = inject(HttpClient);

  // Sube la foto a Cloudinary y devuelve la URL publica
  subir(dataUrl: string) {
    const fd = new FormData();
    fd.append('file', dataUrl);
    fd.append('upload_preset', CONFIG.uploadPreset);
    return this.http
      .post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${CONFIG.cloudName}/image/upload`,
        fd
      )
      .pipe(map(r => r.secure_url));
  }
}
