import { Router } from 'express';
import passport from 'passport';

const router = Router();
// 1. The route to START the login
// Your React app will link to this URL: <a href="http://localhost:8000/api/v1/users/auth/google">
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Request user's profile info and email
  })
);

// 2. The CALLBACK route
// This MUST match the `GOOGLE_CALLBACK_URL` in your .env and Google Console
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000/login-failed', // Redirect to your frontend login page on failure
  }),
  (req, res) => {
    // Successful authentication!
    // Passport has added the user to `req.user`
    // A session cookie is now set.
    
    // Redirect the user back to your frontend dashboard
    res.redirect('http://localhost:3000/dashboard'); 
  }
);

export default router;