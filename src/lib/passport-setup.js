/**
 * Sets up the passport middleware for user authentication.
 * @file
 */

import passport from 'passport';
import { Strategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import data from '../data';
import { hashUserPassword } from './utils';
import constants from './constants';

// Configure the local strategy for use by Passport.
// The local strategy requires a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new GitHubStrategy(
  {
    clientID: constants.GITHUB.CLIENT_ID,
    clientSecret: constants.GITHUB.CLIENT_SECRET,
    callbackURL: constants.GITHUB.CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) =>
    await data.findOrCreateUser({ githubId: profile.id }, (err, user) => done(err, user)),
));

// Configure the local strategy for use by Passport.
// The local strategy requires a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(async (username, password, cb) => {
  let user;

  try {
    user = await data.exec('getUserByUsername', { username });
  } catch (e) {
    return cb(e);
  }

  return (!user || hashUserPassword({ username, password }) !== user.password)
    ? cb(new Error('Invalid credentials'))
    : cb(null, user);
}));

// Configure Passport authenticated session persistence.
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => cb(null, user._id)); // eslint-disable-line no-underscore-dangle, max-len
passport.deserializeUser(async (id, cb) => {
  let user;

  try {
    user = await data.exec('getUserById', { id });
  } catch (e) {
    return cb(e);
  }

  return user ? cb(null, user) : cb(new Error(`No user with id ${id} exists`));
});
