import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  // Inyectamos HttpClient de forma moderna
  private http = inject(HttpClient);
  
  // URL base de tu microservicio NestJS
  private readonly apiUrl = 'http://localhost:3001/clientes'; 

  constructor() {}

  // 1. LISTAR TODOS (Usado en ngOnInit para llenar la tabla)
  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. BUSCAR (Usado en el buscador de la tabla y selector de envíos)
  buscar(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar?termino=${termino}`);
  }

  // 3. CREAR (Unificado: reemplaza a crearCliente)
  crear(nuevoCliente: any): Observable<any> {
    return this.http.post(this.apiUrl, nuevoCliente);
  }

  // 4. ACTUALIZAR (Unificado: sirve para Editar y para Ocultar/Borrar)
  // Cambiamos el tipo de ID a 'any' por si Supabase usa UUID (strings)
  actualizar(id: any, datos: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, datos);
  }

  // 5. ELIMINAR FÍSICO (Opcional, si realmente querés borrar de la DB)
  eliminar(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 6. RESUMEN DE CUENTA (Para generar el PDF)
 // src/app/services/cliente.service.ts

obtenerEnviosMes(clienteId: any, mes: string, anio: string): Observable<any[]> {
  const idStr = String(clienteId).trim();
  // Esta ruta debe coincidir EXACTAMENTE con el Controller de NestJS
  return this.http.get<any[]>(`${this.apiUrl}/${idStr}/resumen?mes=${mes}&anio=${anio}`);
}

  // 7. REGISTRAR ENVÍO
  registrarEnvio(envio: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/envio`, envio);
  }
}