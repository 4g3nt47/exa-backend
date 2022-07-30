// The entry point of the API

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import userRoute from './routes/user.js';
import User, {setupSession} from './models/user.js';
import courseRoute from './routes/course.js';

// Env vars, from .env file.
const DB_URL = process.env.DB_URL;
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || '83efd82860b876e9dec01e9b930ec4250fbbc23bb548fcde4e691f430da845d9';
const ORIGIN_URL = process.env.ORIGIN_URL || 'http://localhost:8000';

// Initallize the API, and load middlewares.
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Setup CORS
app.use(cors({
  origin: ORIGIN_URL,
  credentials: true
}));


// Define our static files directory
app.use("/static", express.static("./static"));

// Configure the session manager
app.use(session({
  secret: SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {
    expires: 1000 * 60 * 60 * 24 * 7
  },
  store: MongoStore.create({
    mongoUrl: DB_URL,
    ttl: 60 * 60 * 24 * 7,
    crypto:{
      secret: SECRET
    }
  })
}));

// Custom middleware that auto-loads profile of logged in users.
app.use(async (req, res, next) => {

  if (req.session.loggedIn){
    try{
      const user = await User.findOne({username: req.session.username});
      setupSession(req.session, user);
    }catch(error){
      req.session.destroy();
      return res.status(500).json({error: "Error loading session: " + error.message});
    }
  }
  next();
});

// Enable imported routes.
app.use("/user", userRoute);
app.use("/course", courseRoute);

// Handle request for invalid endpoints
app.all("*", (req, res) => {
  return res.status(404).json({error: "Invalid endpoint!"});
});

// Error handler.
app.use((error, req, res, next) => {
  console.log(error);
  return res.status(500).json({error: error.message});
});

// For printing to some status message to console.
const output = (msg) => {
  console.log(`[${new Date().toLocaleTimeString()}]  ${msg}`);
};

// Connect to backend database.
output("Connecting to backend database...");
mongoose.connect(DB_URL).then(() => {
  // Start the web server
  output("Starting server...");
  app.listen(PORT, () => {
    output("Server started!");
  });
}).catch(error => {
  output(`Connection error: ${error.message}`);
});
