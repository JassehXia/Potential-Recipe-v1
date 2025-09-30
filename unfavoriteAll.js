// unfavoriteAll.js
const mongoose = require('mongoose');
require('dotenv').config();
const Recipe = require('./models/Recipe'); // adjust path if needed

async function unfavoriteAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Update all recipes to set isFavorite = false
    const result = await Recipe.updateMany({}, { isFavorite: false });
    console.log(`Unfavorited ${result.modifiedCount} recipes`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('Error unfavoriting recipes:', err);
  }
}

// Run the script
unfavoriteAll();
