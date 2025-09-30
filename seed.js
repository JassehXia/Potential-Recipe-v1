import mongoose from "mongoose";
import dotenv from "dotenv";
import Recipe from "./models/Recipe.js";

dotenv.config();

async function seed() {
  try {
    // Connect to MongoDB and use the recipeDB database
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "recipeDB",
    });
    console.log("✅ Connected to recipeDB");

    // Optional: clear existing data so seeding is repeatable
    await Recipe.deleteMany({});
    console.log("🧹 Existing recipes removed");

    // Sample seed data
    const seedRecipes = [
      {
        title: "Spaghetti Carbonara",
        image: "https://example.com/spaghetti.jpg",
        ingredients: ["spaghetti", "eggs", "parmesan", "bacon"],
        link: "https://example.com/spaghetti-carbonara"
      },
      {
        title: "Avocado Toast",
        image: "https://example.com/avocado-toast.jpg",
        ingredients: ["bread", "avocado", "lemon juice", "salt"],
        link: "https://example.com/avocado-toast"
      },
      {
        title: "Chicken Stir Fry",
        image: "https://example.com/stirfry.jpg",
        ingredients: ["chicken", "broccoli", "soy sauce", "garlic"],
        link: "https://example.com/chicken-stir-fry"
      }
    ];

    // Insert seed data
    await Recipe.insertMany(seedRecipes);
    console.log("🌱 Seed data inserted successfully!");

    process.exit(); // exit after seeding
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
