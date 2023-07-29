const mongoose = require("mongoose")
const chats = new mongoose.Schema({

    subjects: [{
      username: { type: String, required: true },
      email: { type: String, required: true },
    }],

    chatId: { type: String, required: true },

    messages: [{
      text: { type: String, required: true },
      sender: { type: String, required: true },
      time: { type: String, required: true },
    }],

  });
  
  const Chat = mongoose.model('chats', chats);
  
  module.exports = Chat;
  export {}