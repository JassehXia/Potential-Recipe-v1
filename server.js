const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Recipe = require("./models/Recipe");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongo connected"))
  .catch(err => console.error(err));

const path = require("path");

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));



app.post("/recipes", async (req, res) => {
  try {
    const recipes = req.body; // expect an array of recipe objects
    const results = [];

    for (const r of recipes) {
      // Check if recipe already exists
      const existing = await Recipe.findOne({ title: r.title });

      if (existing) {
        // Merge ingredients without duplicates
        const newIngredients = Array.from(new Set([...existing.ingredients, ...r.ingredients]));
        existing.ingredients = newIngredients;
        const updated = await existing.save();
        results.push(updated);
      } else {
        // Insert new recipe
        const created = await Recipe.create(r);
        results.push(created);
      }
    }

    res.status(201).json(results);
  } catch (err) {
    console.error("DB insert/update error:", err);
    res.status(500).json({ error: "Failed to save or update recipes" });
  }
});

app.get("/api/recipes", async (req, res) => {
  const all = await Recipe.find().sort({ _id: -1 });
  res.json(all);
});

app.get("/api/recipes/getFavorites", async (req, res) => {
  try {
    const favorites = await Recipe.find({ isFavorite: true });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/recipes/:id/favorite', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { isFavorite: true },        // or toggle with {$bit:{isFavorite:{xor:1}}}
      { new: true }                // return the updated doc
    );
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/recipes/:id/unfavorite', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { isFavorite: false },        // or toggle with {$bit:{isFavorite:{xor:1}}}
      { new: true }                // return the updated doc
    );
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => console.log("Server running on port 3000"));

