import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import session from "express-session"
import passport from "passport"
import "./config/passport-setup.js";
import http from "http"
import {Server} from "socket.io"

import { initializeSocketIO } from './utils/socket.js';
import { startScheduler } from './utils/scheduler.js';
//basic setup
//middlewares 
//io setup
//routes 
//start sheduler
//export  

//basic setup
const app = express()
const httpServer = http.createServer(app); 
const io = new Server(httpServer, { 
  cors:{
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
  }
 });

//middlewares 
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

initializeSocketIO(io)

import userRouter from "./routes/user.routes.js"
import settingsRouter from "./routes/setting.routes.js"
import reminderRouter from "./routes/reminder.routes.js"
import profileRouter from "./routes/profile.routes.js"
import journalRouter from "./routes/journal.routes.js"
import incidentRouter from "./routes/incident.routes.js"
import habitRouter from "./routes/habit.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

app.use('/api/v1/users',userRouter)
app.use('/api/v1/settings',settingsRouter)
app.use("/api/v1/reminders",reminderRouter)
app.use("/api/v1/profiles",profileRouter)
app.use("/api/v1/journals",journalRouter)
app.use("/api/v1/incidents",incidentRouter)
app.use("/api/v1/habits",habitRouter)
app.use("/api/v1/dashboards",dashboardRouter)
// startScheduler(io)

export { app }
