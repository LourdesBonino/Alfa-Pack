import { Routes } from '@angular/router';
import { BienvenidoComponent } from './components/bienvenido/bienvenido';
import { SelectorClienteComponent } from './components/selector-cliente/selector-cliente';

export const routes: Routes = [
  // En lugar de redirigir, ponemos el componente directamente en el inicio ('')
  { path: '', component: BienvenidoComponent }, 
  { path: 'nuevo-recorrido', component: SelectorClienteComponent }, 
  { path: '**', redirectTo: '' }
];