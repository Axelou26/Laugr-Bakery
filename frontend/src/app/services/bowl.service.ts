import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bowl } from '../models/bowl.model';
import { environment } from '../../environments/environment';
import { withResolvedImageUrl, withResolvedImageUrlList } from '../utils/media-url';

@Injectable({ providedIn: 'root' })
export class BowlService {
  private apiUrl = `${environment.apiUrl}/api/bowls`;

  constructor(private http: HttpClient) {}

  getAll(availableOnly?: boolean): Observable<Bowl[]> {
    let params = new HttpParams();
    if (availableOnly) {
      params = params.set('availableOnly', 'true');
    }
    return this.http.get<Bowl[]>(this.apiUrl, { params }).pipe(map(withResolvedImageUrlList));
  }

  getById(id: number): Observable<Bowl> {
    return this.http.get<Bowl>(`${this.apiUrl}/${id}`).pipe(map(withResolvedImageUrl));
  }

  create(bowl: Partial<Bowl>): Observable<Bowl> {
    return this.http.post<Bowl>(this.apiUrl, bowl).pipe(map(withResolvedImageUrl));
  }

  update(id: number, bowl: Partial<Bowl>): Observable<Bowl> {
    return this.http.put<Bowl>(`${this.apiUrl}/${id}`, bowl).pipe(map(withResolvedImageUrl));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
