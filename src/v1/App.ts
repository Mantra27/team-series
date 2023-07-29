'use strict'
require('dotenv').config("../");

//core frameworks
const path = require('path'),
    express = require('express'),
    mongoose = require('mongoose'),
    app = express(),
    
//route modules
    index = require("./routes/index"),
    api = require("./routes/api"),
    auth = require("./routes/auth"),
    {socketInit} = require("./routes/chat"),
    // initMQTT = require("./service/mqtt"),
//util modules
    {mongodbConnect, redisClient} = require("./config/db"),
    passport = require("passport"),
    session = require("express-session"),
    cors = require("cors"),
    fileUpload = require('express-fileupload');

// middlwares/cors
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileUpload()); //for email files suppor
app.use(session({ secret: "kjndjknkjd", saveUninitialized: true, resave: true})); //for handling sessions
app.use(passport.initialize()); 
app.use(passport.session());
app.set('view engine', 'ejs'); //ejs engine support
app.set('views', path.join(__dirname, 'views'));

//loading static pages
mongodbConnect.then(async (res:any)=>{  

    socketInit();
    redisClient.on('error', (err:any) => console.log('Redis Client Error', err));

    await redisClient.connect().then((redisConnected:any)=>{
        console.log("*:Redis (success)")
    });
    

    //all the root backend endpoints
    app.use('/auth', auth);
    app.use('/api', api);
    app.use('*', index);

    console.log(`*:${res.connection.host}`, `MongoDB (success)`);

    app.listen(process.env.port); // init code server

        console.log(`*:${process.env.port} Express (success)`); 

    }).catch((laucherror:any)=>{
        console.log("unable to establish connection to the server", laucherror);
    });

    //crash handler
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // You can add additional logic to handle the error or log it to an external service
    });
      
/*
    backend[8080],
    frontend[3000]
*/