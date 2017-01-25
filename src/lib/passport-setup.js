/**
 * Sets up the passport middleware for user authentication.
 * @file
 */

import passport from 'passport';
import { Strategy } from 'passport-local';

// Configure the local strategy for use by Passport.
// The local strategy requires a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy((username, password, cb) => cb(null, { id: 0, username })));

// Configure Passport authenticated session persistence.
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => cb(null, user.id));
passport.deserializeUser((id, cb) => cb(null, { id: 0, username: 'foo' }));
