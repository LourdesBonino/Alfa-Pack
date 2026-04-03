import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <--- IMPORTANTE

@Component({
  selector: 'app-bienvenido',
  standalone: true,
  imports: [CommonModule, RouterModule], // <--- AGREGALO ACÁ
  templateUrl: './bienvenido.html',
  styleUrls: ['./bienvenido.scss']
})
export class BienvenidoComponent { }