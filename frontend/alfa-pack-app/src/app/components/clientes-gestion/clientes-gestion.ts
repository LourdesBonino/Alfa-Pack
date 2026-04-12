import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes-gestion',
  templateUrl: './clientes-gestion.html',
  styleUrls: ['./clientes-gestion.scss'],
  standalone: true, 
  imports: [CommonModule, FormsModule] 
})
export class ClientesGestionComponent implements OnInit {
  private clienteService = inject(ClienteService);

  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtro: string = '';
  
  mostrarModal = false;
  editando = false;

  clienteForm: any = { 
    id: null, 
    nombre_razon_social: '', 
    dni_cuit: '', 
    direccion: '', 
    localidad: 'General Deheza', 
    telefono: '',
    activo: true 
  };

  ngOnInit() { 
    this.cargarClientes(); 
  }

  // --- CARGA Y FILTRADO ---
  cargarClientes() {
    this.clienteService.listarTodos().subscribe({
      next: (data: any) => {
        // Solo mostramos clientes que no estén ocultos
        this.clientes = data.filter((c: any) => c.activo !== false); 
        this.clientesFiltrados = [...this.clientes];
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  filtrar() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }
    this.clientesFiltrados = this.clientes.filter(c => 
      c.nombre_razon_social?.toLowerCase().includes(term) || 
      c.dni_cuit?.includes(term)
    );
  }

  // --- GESTIÓN DE MODAL ---
  abrirModalNuevo() { 
    this.editando = false; 
    this.resetForm(); 
    this.mostrarModal = true; 
  }

  editar(cliente: any) { 
    this.editando = true; 
    this.clienteForm = { ...cliente }; 
    this.mostrarModal = true; 
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetForm();
  }

  // --- GUARDAR (ALTA Y MODIFICACIÓN) ---
  guardar() {
    if (!this.clienteForm.nombre_razon_social) {
      alert('El nombre es obligatorio.');
      return;
    }
    
    const operacion = this.editando 
      ? this.clienteService.actualizar(this.clienteForm.id, this.clienteForm)
      : this.clienteService.crear(this.clienteForm);

    operacion.subscribe({
      next: () => {
        this.cargarClientes();
        this.cerrarModal();
        alert('¡Operación exitosa en Alfa Pack!');
      },
      error: (err: any) => {
        console.error('Error al guardar:', err);
        alert('Hubo un problema al guardar los datos.');
      }
    });
  }

  // --- OCULTAR CLIENTE (BAJA LÓGICA) ---
  borrar(id: any) {
    if (confirm('¿Deseas ocultar este cliente de la lista de Alfa Pack?')) {
      this.clienteService.actualizar(id, { activo: false }).subscribe({
        next: () => {
          alert('Cliente eliminado con éxito.');
          this.cargarClientes(); 
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el cliente.');
        }
      });
    }
  }

  // --- RESUMEN DE CUENTA Y PDF ---
  verResumen(cliente: any) {
    if (!cliente || !cliente.id) {
      alert('Error: El cliente no tiene un ID válido.');
      return;
    }

    const mesSeleccionado = prompt("Ingrese el mes (1-12):", (new Date().getMonth() + 1).toString());
    if (mesSeleccionado === null || mesSeleccionado === "") return;

    const anioSeleccionado = "2026"; 

    this.clienteService.obtenerEnviosMes(cliente.id.toString(), mesSeleccionado, anioSeleccionado).subscribe({
      next: (envios: any[]) => {
        if (envios && envios.length > 0) {
          this.generarPDFResumen(cliente, envios, mesSeleccionado);
        } else {
          alert('No se encontraron envíos para este cliente en el mes seleccionado.');
        }
      },
      error: (err) => {
        console.error('Error detallado:', err);
        alert('Error de comunicación: Verificá que el Microservicio (Puerto 3001) esté encendido.');
      }
    });
  }

  generarPDFResumen(cliente: any, envios: any[], mes: string) {
  const ventana = window.open('', '_blank');
  
  // Sumamos solo lo que es Cuenta Corriente
  const totalCC = envios
    .filter(e => e.forma_pago === 'Cuenta Corriente')
    .reduce((acc, e) => acc + (e.precio_envio || 0), 0);

  ventana?.document.write(`
    <html>
      <head>
        <title>Resumen - ${cliente.nombre_razon_social}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; font-size: 12px; }
          .header { border-bottom: 3px solid #0040A0; padding-bottom: 10px; margin-bottom: 20px; }
          h1 { color: #0040A0; margin: 0; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0040A0; color: white; text-transform: uppercase; font-size: 10px; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .total-box { text-align: right; margin-top: 20px; font-size: 1.5em; font-weight: bold; color: #d32f2f; }
          .footer { margin-top: 40px; font-size: 0.8em; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
          .badge { padding: 2px 5px; border-radius: 3px; font-size: 0.8em; font-weight: bold; }
          .cr { background-color: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; } /* Estilo Contrareembolso */
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALFA PACK - Resumen de Cuenta</h1>
          <p><strong>Cliente:</strong> ${cliente.nombre_razon_social} | <strong>Mes:</strong> ${mes} / 2026</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Destino / Detalle</th>
              <th>Pago</th>
              <th>C. Reembolso</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            ${envios.map(e => `
              <tr>
                <td>${e.fecha_servicio ? new Date(e.fecha_servicio).toLocaleDateString('es-AR') : 'S/F'}</td>
                <td><strong>${e.tipo_camino || 'Servicio'}</strong></td>
                <td>${e.direccion_destino || 'No especificada'}</td>
                <td>${e.forma_pago || 'S/D'}</td>
                <td>
                  ${e.valor_mercaderia && e.valor_mercaderia > 0 
                    ? `<span class="badge cr">COD: $${e.valor_mercaderia}</span>` 
                    : '-'}
                </td>
                <td>$${e.precio_envio || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-box">Total Cuenta Corriente: $${totalCC}</div>
        
        <div class="footer">
          Documento generado por Sistema de Gestión Alfa Pack - General Deheza<br>
          Prohibida su reproducción sin autorización.
        </div>
        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body>
    </html>
  `);
  ventana?.document.close();
}

  resetForm() {
    this.clienteForm = { 
      id: null, 
      nombre_razon_social: '', 
      dni_cuit: '', 
      direccion: '', 
      localidad: 'General Deheza', 
      telefono: '',
      activo: true
    };
  }
}