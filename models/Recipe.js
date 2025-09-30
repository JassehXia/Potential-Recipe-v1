const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: String,
  image: String,
  ingredients: [String],
  link: String,
  isFavorite: { type: Boolean, default: false } // new field
});

module.exports = mongoose.model('Recipe', recipeSchema);
