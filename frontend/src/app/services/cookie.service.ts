import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cookie } from '../models/cookie.model';
import { environment } from '../../environments/environment';
import { withResolvedImageUrl, withResolvedImageUrlList } from '../utils/media-url';

export interface CookieSearchParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CookieService {
  private apiUrl = `${environment.apiUrl}/api/cookies`;

  constructor(private http: HttpClient) {}

  getAll(availableOnly = false): Observable<Cookie[]> {
    return this.search({ availableOnly: availableOnly || undefined });
  }

  getIngredients(availableOnly = false): Observable<Cookie[]> {
    return this.search({ availableOnly: availableOnly || undefined });
  }

  search(params: CookieSearchParams): Observable<Cookie[]> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice);
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice);
    if (params.availableOnly) httpParams = httpParams.set('availableOnly', 'true');
    return this.http
      .get<Cookie[]>(this.apiUrl, { params: httpParams })
      .pipe(map(withResolvedImageUrlList));
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getLowStock(threshold = 10): Observable<Cookie[]> {
    return this.http
      .get<Cookie[]>(`${this.apiUrl}/low-stock`, { params: { threshold } })
      .pipe(map(withResolvedImageUrlList));
  }

  getById(id: number): Observable<Cookie> {
    return this.http.get<Cookie>(`${this.apiUrl}/${id}`).pipe(map(withResolvedImageUrl));
  }

  create(cookie: Partial<Cookie>): Observable<Cookie> {
    return this.http.post<Cookie>(this.apiUrl, cookie).pipe(map(withResolvedImageUrl));
  }

  update(id: number, cookie: Partial<Cookie>): Observable<Cookie> {
    return this.http.put<Cookie>(`${this.apiUrl}/${id}`, cookie).pipe(map(withResolvedImageUrl));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
