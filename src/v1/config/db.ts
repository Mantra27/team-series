const mongoose = require("mongoose");
const path = require("path");
// require('dotenv').config({path: path.resolve(__dirname + '/../../../.env')});

const {createClient} = require("redis")
mongoose.set('strictQuery', false);

// const redisUrl = process.env.redisurl;
// const redisPassword = process.env.redispassword;
// const mongodburl = process.env.redisurl;


const redisClient = createClient({
    password: 'RvRicVkKR0PsEyyS8tIqSgKGLPfdELcn',
    socket: {
        host: 'redis-19383.c212.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 19383
    }
});

const mongodbConnect = mongoose.connect(
  "mongodb+srv://team_series:kjfnsnklq273648798@cluster0.q2qww.mongodb.net/?retryWrites=true&w=majority"
  ,
          { useNewUrlParser: true,
            useUnifiedTopology: true
          }
      )

module.exports = {mongodbConnect, redisClient}
export {}
