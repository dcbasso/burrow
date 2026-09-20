import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Section, Service, ServiceCredentialInput } from './models';

/** Corpo de criação/edição de serviço: como `Service`, mas com credenciais em formato de entrada. */
type ServiceRequestBody = Partial<Omit<Service, 'credentials'>> & { credentials?: ServiceCredentialInput[] };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // --- Categorias (sections) ---
  listSections(): Observable<Section[]> {
    return this.http.get<Section[]>('/api/sections');
  }
  createSection(body: Partial<Section>): Observable<Section> {
    return this.http.post<Section>('/api/sections', body);
  }
  updateSection(id: string, body: Partial<Section>): Observable<Section> {
    return this.http.put<Section>(`/api/sections/${id}`, body);
  }
  deleteSection(id: string): Observable<unknown> {
    return this.http.delete(`/api/sections/${id}`);
  }
  reorderSections(items: { _id: string; order: number }[]): Observable<unknown> {
    return this.http.put('/api/sections/reorder', { items });
  }

  // --- Serviços (services) ---
  listServices(): Observable<Service[]> {
    return this.http.get<Service[]>('/api/services');
  }
  createService(body: ServiceRequestBody): Observable<Service> {
    return this.http.post<Service>('/api/services', body);
  }
  updateService(id: string, body: ServiceRequestBody): Observable<Service> {
    return this.http.put<Service>(`/api/services/${id}`, body);
  }
  deleteService(id: string): Observable<unknown> {
    return this.http.delete(`/api/services/${id}`);
  }
  reorderServices(items: { _id: string; order: number }[]): Observable<unknown> {
    return this.http.put('/api/services/reorder', { items });
  }
  renameTag(from: string, to: string): Observable<unknown> {
    return this.http.put('/api/services/tags/rename', { from, to });
  }
  removeTag(tag: string): Observable<unknown> {
    return this.http.put('/api/services/tags/remove', { tag });
  }
  revealCredential(serviceId: string, credId: string): Observable<{ username: string; password: string }> {
    return this.http.get<{ username: string; password: string }>(
      `/api/services/${serviceId}/credentials/${credId}/reveal`,
    );
  }
}
