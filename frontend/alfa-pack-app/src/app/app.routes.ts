import { Routes } from '@angular/router';
import { BienvenidoComponent } from './components/bienvenido/bienvenido';
import { SelectorClienteComponent } from './components/selector-cliente/selector-cliente';
import { ClientesGestionComponent } from './components/clientes-gestion/clientes-gestion';  

export const routes: Routes = [
  // 1. Ruta inicial
  { path: '', component: BienvenidoComponent }, 

  // 2. Ruta para despachos
  { path: 'nuevo-recorrido', component: SelectorClienteComponent }, 

  // 3. Ruta para el ABMC de clientes (DEBE IR ANTES DEL **)
  { path: 'gestionar-clientes', component: ClientesGestionComponent },

  // 4. Comodín (SIEMPRE AL FINAL)
  { path: '**', redirectTo: '' } 
];