import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import {User} from '../models/user.model.js'; 

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

passport.use(
  new LocalStrategy(
    {
      usernameField : 'email'
      //it tells the passport that we are logging in with email 
    },
    async (email,password,done) => {
      //check if there is any user with this mail
      try {
        const user = await User.findOne({email});
        if(!user){
          done(null,false,{message : "No user found with this email"})
        }
        //check if this guy is logged with password or google 
        if(!user.password){
          done(null,false,{message : "Please login with google..."})
        }
  
        //check the password is same as entered 
        const isPasswordCorrect = await user.isPasswordCorrect(password)
        if(!isPasswordCorrect){
          done(null,false,{message : "Invalid password"})
        }
        
        done(null,user)
      } catch (error) {
        return done(error,null)
      }

    }
  )
)
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