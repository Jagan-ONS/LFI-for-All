import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import session from "express-session"
import passport from "passport"
import "./config/passport-setup.js";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Put this in your .env
    resave: false,
    saveUninitialized: false,
  })
)

app.use(passport.initialize())
app.use(passport.session())


import userRouter from "./routes/user.routes.js"

app.use('/api/v1/users',userRouter)

export { app }
