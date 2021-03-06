import _ from 'lodash';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import Joi from 'joi';
import SpotifyWebApi from 'spotify-web-api-node';
import APIError from '../helpers/APIError';
import paramValidation from '../../config/param-validation';
import config from '../../config/config';
import MySQLInterface from '../helpers/MySQLInterface';
import SpotifyInterface from '../helpers/SpotifyInterface';

const mysqlInterface = new MySQLInterface();
const spotifyInterface = new SpotifyInterface();

function getAuthUrl(req, res, next) {;
  const authUrl = spotifyInterface.getAuthUrl(req.query.authType);
  res.json({authUrl})
}

function login(req, res, next) {
  const { email } = req.body;
  const { spotifyAuthCode } = req.body;

  var userId;
  var accessToken;
  var refreshToken;

  mysqlInterface.getUserInfo(email)
    .then(userInfo => {
      if (!userInfo) {
        throw new Error('User not found');
      } else {
        return spotifyInterface.exchangeAccessCodeForTokens(spotifyAuthCode)
          .then(response => {
            return Promise.resolve({userId: userInfo.userId, accessToken: response.body.access_token, refreshToken: response.body.refresh_token});
          })
      }
    })
    .then(userInfo => {
      return mysqlInterface.setUserSpotifyTokens(email, userInfo.userId, userInfo.accessToken, userInfo.refreshToken)
        .then(result => {
          return Promise.resolve(userInfo);
        })
    })
    .then(userInfo => {
      return new Promise((resolve, reject) => {
        spotifyInterface.getPlaylistIds(userInfo.accessToken, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve({playlistId: data.releaseDiscovery, userInfo});
          }
        })  
      })
    })
    .then(userPlaylistInfo => {
      //const user = { email, userId: userPlaylistInfo.userInfo.userId };
      const user = { email };
      const token = jwt.sign(user, config.jwtSecret, { expiresIn: '40000h' });

      return res.status(200).json({
        token
      });
    })
    .catch(err => {
      const apiError = new APIError(err);
      next(apiError);
    })
}

function register(req, res, next) {
  const { email } = req.body;
  const { spotifyAuthCode } = req.body;

  var userId;
  var accessToken;
  var refreshToken;

  mysqlInterface.userExists(email)
    .then(userExists => {
      if (userExists) {
        throw new Error('User already registered');
      } else {
        return spotifyInterface.exchangeAccessCodeForTokens(spotifyAuthCode);
      }
    })
    .then(response => {
      userId = response.body.userId;
      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
      return Promise.resolve();
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        spotifyInterface.getPlaylistIds(accessToken, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        })  
      })
    })
    .then(playlistIds => {
      if (playlistIds.releaseDiscovery) {
        return Promise.resolve(playlistIds.releaseDiscovery);
      } else {
        return spotifyInterface.createAggregatePlaylist(userId, accessToken)
        .then(playlistResult => {
          console.log('playlistResult', playlistResult)
          return Promise.resolve(playlistResult.body.id);
        })
      }
    })
    .then(playlistId => {
      return mysqlInterface.setUserSpotifyTokens(email, userId, accessToken, refreshToken)
        .then(result => {
          return Promise.resolve(playlistId);
        })
    })
    .then(playlistId => {
      const user = { email };
      const token = jwt.sign(user, config.jwtSecret, { expiresIn: '40000h' });
      return res.status(200).json({
        token
      });
    })
    .catch(err => {
      const apiError = new APIError(err);
      next(apiError);
    })
}

export default {
  getAuthUrl,
  login,
  register
};
