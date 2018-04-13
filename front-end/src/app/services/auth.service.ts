import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {

  constructor(private http: Http,
  						public router: Router) {
  }

  public getSpotifyAuthUrl() {
		return new Promise((resolve, reject) => {
			this.http.get(`${environment.apiDomain}api/user/auth-url`)
				.toPromise()
				.then(res => {
					resolve(res.json().authUrl)
				})
        .catch(err => {
          alert(err)
        })
		})
  }

  public submitAccessCode(spotifyAccessCode) {
		return new Promise((resolve, reject) => {
			this.http.post(`${environment.apiDomain}api/user/code`, {spotifyAccessCode})
				.toPromise()
				.then(res => {
					resolve(res.json())
				}).catch(err => {
          reject(err)
        })
		})
  }

  public setSession(userId): void {  
    localStorage.setItem('userId', userId);
  }

  private getSession(): void {
    const userSession = {
      access_token: localStorage.getItem('access_token'),
      id_token: localStorage.getItem('id_token')
    };
  }

  public logout(): void {
    localStorage.removeItem('userId');
    this.router.navigate(['/']);
  }

  public isAuthenticated() {
    return new Promise((resolve, reject) => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.http.post(`${environment.apiDomain}api/user/authenticate`, { userId })
          .toPromise()
          .then(response => {
            resolve(response.json());
          }).catch(err => {
            reject(err);
          })
      } else {
        resolve(false);
      }
    });
  }
}


