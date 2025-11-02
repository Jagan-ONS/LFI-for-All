import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js'; // Make sure this path is correct

passport.use(
  new GoogleStrategy(
    {
      // Options for the Google strategy
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // This function is called when Google sends back the user profile
      // This is where you find or create a user in your OWN database
      try {
        // 'profile.id' is the unique Google ID
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // If we found a user, return them
          return done(null, existingUser);
        }

        // If it's a new user, create them in your database
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.displayName, // You might want to customize this
          fullName : profile.fullName
          // Add any other fields you require
          // e.g., avatar: profile.photos[0].value
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// This saves the user's MongoDB _id into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// This retrieves the full user details from the database using the _id from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});