import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Requerido para *ngFor (Error NG8103)
import { FormsModule } from '@angular/forms';   // Requerido para [(ngModel)] (Error NG8002)
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes-gestion',
  templateUrl: './clientes-gestion.html',
  styleUrls: ['./clientes-gestion.scss'],
  standalone: true, // Asegurate de que esto esté presente
  imports: [CommonModule, FormsModule] // <--- ESTO SOLUCIONA TUS ERRORES DE TERMINAL
})
export class ClientesGestionComponent implements OnInit {
  // Inyección del servicio
  private clienteService = inject(ClienteService);

  // Listados
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtro: string = '';
  
  // Control de Interfaz
  mostrarModal = false;
  editando = false;

  // Modelo del Formulario
  clienteForm: any = { 
    id: null, 
    nombre_razon_social: '', 
    dni_cuit: '', 
    direccion: '', 
    localidad: 'General Deheza', 
    telefono: '' 
  };

  ngOnInit() { 
    this.cargarClientes(); 
  }

  cargarClientes() {
    this.clienteService.listarTodos().subscribe({
      next: (data: any[]) => { 
        this.clientes = data; 
        this.clientesFiltrados = data; 
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

  // --- OPERACIONES CRUD ---

  guardar() {
    if (!this.clienteForm.nombre_razon_social) {
      alert('El nombre o razón social es obligatorio.');
      return;
    }
    
    const operacion = this.editando 
      ? this.clienteService.actualizarCliente(this.clienteForm.id, this.clienteForm)
      : this.clienteService.crearCliente(this.clienteForm);

    operacion.subscribe({
      next: () => {
        this.cargarClientes();
        this.mostrarModal = false;
        this.resetForm();
        console.log('Operación exitosa en Alfa Pack');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Hubo un problema al guardar los datos.');
      }
    });
  }

  borrar(id: number) {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clienteService.eliminarCliente(id).subscribe({
        next: () => {
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error al borrar:', err);
          alert('No se pudo borrar el cliente.');
        }
      });
    }
  }

  resetForm() {
    this.clienteForm = { 
      id: null, 
      nombre_razon_social: '', 
      dni_cuit: '', 
      direccion: '', 
      localidad: 'General Deheza', 
      telefono: '' 
    };
  }
}