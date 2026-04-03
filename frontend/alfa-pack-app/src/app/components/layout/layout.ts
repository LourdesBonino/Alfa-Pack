import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar'; 

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent], // <--- Ahora sí lo va a reconocer
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent {}