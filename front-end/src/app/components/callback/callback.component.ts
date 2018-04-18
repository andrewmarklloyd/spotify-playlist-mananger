import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

	private window: any;
  private initialized: boolean;

  constructor(private authService: AuthService,
              private router: Router,
              private route: ActivatedRoute) {
    this.window = window;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.code) {
        this.authService.submitAccessCode(params.code)
        .then(res => {
          if (res['userId']) {
            this.authService.setSession(res['userId']);
            return this.getPlaylistId();
          } else {
          	return Promise.reject('There was an error');
          }
        })
        .then(data => {
        	if (data['releaseDiscovery']) {
        		return Promise.resolve(data);
        	} else {
        		return this.createPlaylist();
        	}
        })
        .then(result => {
          console.log(result)
          const playlistUrl = `https://open.spotify.com/user/${result['userId']}/playlist/${result['releaseDiscovery']}`;
        })
        .catch(err => {
          console.log(err);
        })
      } else {
        this.router.navigate(['/'], {queryParams: {}});
      }
    })
  }

  getPlaylistId() {
  	return this.authService.getPlaylistId();
  }

  createPlaylist() {
  	return this.authService.createPlaylist();
  }

  getSpotifyAuthUrl() {
  	this.authService.getSpotifyAuthUrl()
  		.then(authUrl => {
        this.window.location.href = authUrl;
  		})
  }

  logout() {
    this.authService.logout();
  }

}
