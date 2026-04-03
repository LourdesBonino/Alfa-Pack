import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  // Asegúrate de que el puerto coincida con el de tu NestJS (3000 o 3001)
  private apiUrl = 'http://localhost:3001/clientes';

  constructor(private http: HttpClient) {}

  // 1. LISTAR TODOS (GET)
  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. BUSCAR POR NOMBRE (GET)
  buscarClientes(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar?termino=${termino}`);
  }

  // 3. CREAR CLIENTE (POST)
  crearCliente(nuevoCliente: any): Observable<any> {
    return this.http.post(this.apiUrl, nuevoCliente);
  }

  // 4. ACTUALIZAR CLIENTE (PATCH)
  actualizarCliente(id: number, clienteForm: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, clienteForm);
  }

  // 5. ELIMINAR CLIENTE (DELETE)
  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 6. REGISTRAR ENVÍO (POST)
  registrarEnvio(envio: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/envio`, envio);
  }
}