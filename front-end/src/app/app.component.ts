import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
	isLoggedIn: boolean;
	window: any;

  constructor(private authService: AuthService,
              private router: Router) {
    this.window = window;
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  logout() {
  	this.authService.logout();
  	this.window.location.href = '/';
  }
}
