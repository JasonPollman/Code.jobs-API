/**
 * Defines the /login route.
 * @file
 */

import passport from 'passport';
import JSONResponse from '../lib/json-response';
import '../lib/passport-setup';

/**
 * Authenticates a user.
 * @export
 */
export default [
  {
    // Basic (local) login strategy
    method: 'post',
    specificity: 0,
    permission: 'LOGIN',
    match: '/login',
    handler: (req, res) => {
      if (req.isAuthenticated()) {
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'already logged in',
          user: { ...req.user, password: undefined },
        }));
      }

      return passport.authenticate('local')(req, res, (e) => {
        if (e) return res.status(401).json(new JSONResponse(e));
        return res.status(200).json(new JSONResponse({ success: true, message: 'log in successful', user: req.user }));
      });
    },
  },
  {
    // Log in using GitHub strategy
    method: 'post',
    specificity: 0,
    permission: 'LOGIN',
    match: '/login/github',
    handler: (req, res) => {
      if (req.isAuthenticated()) {
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'already logged in',
          user: { ...req.user, password: undefined },
        }));
      }

      return passport.authenticate('github', { scope: ['user:email'] })(req, res, (e) => {
        if (e) return res.status(401).json(new JSONResponse(e));
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'log in successful',
          user: { ...req.user, password: undefined },
        }));
      });
    },
  },
  {
    // Log in using GitHub strategy
    method: 'post',
    specificity: 0,
    permission: 'LOGIN',
    match: '/login/linkedin',
    handler: (req, res) => {
      if (req.isAuthenticated()) {
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'already logged in',
          user: { ...req.user, password: undefined },
        }));
      }

      return passport.authenticate('linked', { scope: ['user:email'] })(req, res, (e) => {
        if (e) return res.status(401).json(new JSONResponse(e));
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'log in successful',
          user: { ...req.user, password: undefined },
        }));
      });
    },
  },
  {
    // Callback for GitHub login
    method: 'post',
    specificity: 0,
    permission: 'LOGIN',
    match: '/login/github/callback',
    handler: (req, res) => {
      if (req.isAuthenticated()) {
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'already logged in',
          user: { ...req.user, password: undefined },
        }));
      }

      return passport.authenticate('github')(req, res, (e) => {
        if (e) return res.status(401).json(new JSONResponse(e));
        return res.status(200).json(new JSONResponse({
          success: true,
          message: 'log in successful',
          user: { ...req.user, password: undefined },
        }));
      });
    },
  },
];
