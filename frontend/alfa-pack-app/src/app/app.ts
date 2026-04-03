import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html', // <-- ASEGURATE QUE TENGA '.component'
  styleUrls: ['./app.scss']  // <-- ASEGURATE QUE TENGA '.component'
})
export class AppComponent { }