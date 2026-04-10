import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private apiUrl = `${environment.apiUrl}/api/admin/upload`;

  constructor(private http: HttpClient) {}

  upload(file: File | Blob): Observable<{ url: string }> {
    const formData = new FormData();
    const blob = file instanceof File ? file : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
    formData.append('file', blob);
    return this.http.post<{ url: string }>(this.apiUrl, formData);
  }
}
