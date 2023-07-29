const mongoose = require("mongoose")
const crimeSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Type of incident (e.g., theft, assault, vandalism)
    location: { type: [Number], required: true }, // [longitude, latitude]
    date: { type: Date, required: true },
    // You can add other relevant crime data fields as needed
  });
  
  const Crime = mongoose.model('Crime', crimeSchema);
  
  module.exports = Crime;
  export {}