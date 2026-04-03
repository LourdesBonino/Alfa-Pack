import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http'; // <--- AGREGADO: Importación vital
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-selector-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selector-cliente.html',
  styleUrls: ['./selector-cliente.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectorClienteComponent {
  // Inyecciones de dependencias
  private clienteService = inject(ClienteService);
  private http = inject(HttpClient); // <--- ARREGLADO: Ahora el motor HTTP está conectado

  // --- Variables de Estado ---
  termino: string = '';
  resultados: any[] = [];
  clienteSeleccionado: any = null; 
  
  // --- Datos del Envío ---
  direccionEnvio: string = '';
  bultos: number = 1;
  observaciones: string = '';
  tipoEnvio: string = 'A'; 
  precio: number | null = null;
  fechaRecorrido: string = new Date().toISOString().split('T')[0];
  formaPago: string = 'Efectivo'; 
  opcionesPago: string[] = ['Efectivo', 'Transferencia', 'Cuenta Corriente', 'Pendiente de Cobro'];
  nuevoIdEnvio: any = null;
  destinatarioPersona: any = ''; // Inicializado como string vacío

  // --- Función de Búsqueda ARREGLADA ---
  buscar() {
    if (this.termino.length > 2) {
      // Ahora 'this.http' ya no es undefined, es una instancia de HttpClient
      this.http.get(`http://localhost:3001/clientes/buscar?termino=${this.termino}`)
        .subscribe({
          next: (res: any) => {
            this.resultados = res;
            console.log('Resultados de Alfa Pack:', res);
          },
          error: (err: any) => {
            console.error('Error al conectar con el microservicio:', err);
          }
        });
    } else {
      this.resultados = [];
    }
  }

  seleccionar(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.direccionEnvio = cliente.direccion || '';
    this.resultados = [];
  }

  confirmarEnvio() {
    if (!this.clienteSeleccionado) return;

    const datosParaEnviar = {
      cliente_id: this.clienteSeleccionado.id,
      camino: this.tipoEnvio,
      bultos: this.bultos,
      precio: this.precio,
      observaciones: this.observaciones,
      fecha: this.fechaRecorrido,
      forma_pago: this.formaPago,
      direccion_destino: this.direccionEnvio,
      destinatario: this.destinatarioPersona,
    };

    this.clienteService.registrarEnvio(datosParaEnviar).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.nuevoIdEnvio = res[0].id;
        } else if (res && res.id) {
          this.nuevoIdEnvio = res.id;
        }
        
        this.imprimirComprobantes();
        alert('¡Envío de Alfa Pack registrado con éxito!');
        this.cancelar();
      },
      error: (err: any) => {
        console.error('Error al registrar:', err);
        alert('Hubo un error al guardar. Revisá la conexión.');
      }
    });
  }

  imprimirComprobantes() {
    const contenido = document.getElementById('seccion-impresion')?.innerHTML;
    if (!contenido) return;

    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
            .hoja-a4 { 
              width: 21cm; 
              height: 29.7cm; 
              padding: 1.5cm; 
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between; 
            }
            .alfa-etiqueta-pro {
              border: 3px solid #000;
              width: 12cm;
              padding: 15px;
              border-radius: 10px;
            }
            .etiqueta-header { font-size: 24px; font-weight: bold; border-bottom: 2px solid #000; text-align: center; }
            .etiqueta-content p { font-size: 16px; margin: 8px 0; }
            .etiqueta-footer { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; }
            .alfa-remito-pro {
              border: 1px solid #333;
              padding: 20px;
              width: 100%;
              height: 10cm;
              box-sizing: border-box;
              background: #fff;
            }
            .remito-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0040A0; padding-bottom: 10px; }
            .logo-area h1 { margin: 0; color: #0040A0; font-size: 22px; }
            .tabla-remito { width: 100%; margin-top: 20px; border-collapse: collapse; }
            .tabla-remito td { padding: 10px; border: 1px solid #eee; font-size: 14px; }
            .firmas-area { display: flex; justify-content: space-between; margin-top: 50px; }
            .firma-box { border-top: 1px solid #000; width: 40%; text-align: center; font-size: 12px; padding-top: 5px; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  }

  cancelar() {
    this.clienteSeleccionado = null;
    this.termino = '';
    this.direccionEnvio = '';
    this.bultos = 1;
    this.precio = null;
    this.observaciones = '';
    this.tipoEnvio = 'A';
    this.resultados = [];
    this.formaPago = 'Efectivo';
    this.fechaRecorrido = new Date().toISOString().split('T')[0];
    this.nuevoIdEnvio = null;
    this.destinatarioPersona = '';
  }
}