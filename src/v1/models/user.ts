const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const Book = require("../models/Book");

const UserSchema  = new mongoose.Schema({

    username :{
        type  : String,
        required : true
    },

    email :{
        type  : String,
        required : true
    },

    password :{
        type  : String,
    },
    
    contactNumber: {
        type:String,
        required: true
    },
    
    location:{
        type: String, 
        required: true
    },

    lastKnownLoginMethod: {
        type: String,
        default: null
    },

    lastLoginTime: {
        type: String,
        default: null
    },

    lastLoggedInIp:{
        type: String,
        default: null
    },

    payment_method:{
        type: String,
        default: null
    },

    books: [{
        type: Array //array of object
    }]


});


const User = mongoose.model('Users', UserSchema, "users");
export {}
module.exports = User;