// Imports
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const userRoute = require('./routes/user');
const {User, setupSession} = require('./models/user');

// Our env vars, from .env file.
const DB_URL = process.env.DB_URL;
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || '83efd82860b876e9dec01e9b930ec4250fbbc23bb548fcde4e691f430da845d9';

// Initallize the API.
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

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

app.use(async (req, res, next) => {

  if (req.session.loggedIn){
    try{
      const user = await User.findOne({username: req.session.username});
      setupSession(session, user);
    }catch(error){
      console.log(error);
      req.session.destroy();
    }
    next();
  }else{
    next();
  }
});

app.use("/user", userRoute);

app.all("*", (req, res) => {
  return res.status(404).json({"error": "Invalid endpoint!"});
})

// Connect to backend database.
console.log("[*] Connecting to backend database...");
mongoose.connect(DB_URL).then(() => {
  console.log("[*] Starting server...");
  app.listen(PORT, () => {
    console.log("[+] Server started!");
  });
}).catch(error => {
  console.log(`[-] Connection error: ${error.message}`);
});
