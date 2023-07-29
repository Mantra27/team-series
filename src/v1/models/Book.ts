const mongoose = require("mongoose")
const Bookschema = new mongoose.Schema({

    title: { type: String, required: true }, // Type of incident (e.g., theft, assault, vandalism)
    author: { type: String, required: true }, // [longitude, latitude]
    genre: { type: String, required: true },
    img: { type: String, required: true },
    summary: { type: String, required: true },
    status: { type: Number, required: true }, // 1 - lend, 2 - borrow, 3 - sell/buy, 4-not-available
    price: { type: Number, required: true },
    preffredPaymentMethod: { type: String, required: true },
    pastOwners: { type: Array, required: true },
    currentOwner: {
        name: { type: String, required: true },
        contactNumber: { type: String, required: true },
        location: { type: String, required: true },
        prefferedPaymentMethod: { type: String, required: true },
    },

  });
  
  const Book = mongoose.model('Book', Bookschema);
  
  module.exports = Book;
  export {}