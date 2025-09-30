const ingredientList = document.getElementById("ingredientList");
const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const ingredientsAdded = document.getElementById("ingredientsAdded");
const recipeBox = document.getElementById("recipeBox");
const ingredientsListDropdown = document.getElementById("ingredientList");

let selectedIngredients = [];
let foundRecipes = [];

// Replace with your Render backend URL
const BACKEND_URL = "https://potential-recipe-v1.onrender.com/";

// Horizontal scroll with mouse wheel
recipeBox.addEventListener('wheel', (e) => {
  e.preventDefault();
  recipeBox.scrollLeft += e.deltaY;
}, { passive: false });

// Add ingredient
ingredientsListDropdown.addEventListener("change", () => {
  const ingredient = ingredientsListDropdown.value;
  if (ingredient !== "0" && !selectedIngredients.includes(ingredient)) {
    selectedIngredients.push(ingredient);
    ingredientsAdded.textContent = selectedIngredients.join(", ");
  }
  ingredientsListDropdown.value = "0";
});

// Search button
searchButton.addEventListener("click", () => {
  loadRecipesFromDB();
});

// Reset button
resetButton.addEventListener("click", () => {
  selectedIngredients = [];
  foundRecipes = [];
  ingredientsAdded.textContent = "Ingredients Will Appear Here";
  recipeBox.innerHTML = "";
});

// Create a recipe card
function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.id = `recipe-card-${recipe._id}`;

  const favText = recipe.isFavorite ? "Favorited" : "Mark as Favorite";

  card.innerHTML = `
    <a>
      <img src="${recipe.image}" alt="${recipe.title}" />
      <h3>${recipe.title}</h3>
    </a>
    <div class="buttonBox">
      <button
        id="favorite-button-${recipe._id}"
        class="favorite-button"
        onclick="favoriteRecipe('${recipe._id}')"
      >
        ${favText}
      </button>
      <button
        id="view-recipe-button-${recipe._id}"
        class="view-recipe-button"
        onclick="window.open('${recipe.link || recipe.instructions}', '_blank')"
      >
        View Recipe
      </button>
    </div>
  `;

  recipeBox.appendChild(card);
}

// Load recipes from MongoDB
async function loadRecipesFromDB(numToShow = 5, append = false, excludeIds = []) {
  try {
    const response = await fetch(`/api/recipes`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const dbRecipes = await response.json();

    if (!append) recipeBox.innerHTML = "";

    const pantryItems = ["salt","pepper","oil","flour","water","sugar"];
    const matchingRecipes = dbRecipes.filter(recipe => {
      if (recipe.isFavorite) return false;
      if (excludeIds.includes(recipe._id)) return false;
      return recipe.ingredients.every(ing =>
        selectedIngredients.includes(ing) || pantryItems.includes(ing.toLowerCase())
      ) && selectedIngredients.every(ing =>
        recipe.ingredients.includes(ing) || pantryItems.includes(ing.toLowerCase())
      );
    });

    const shuffled = matchingRecipes.sort(() => Math.random() - 0.5);
    const recipesToShow = shuffled.slice(0, numToShow);
    recipesToShow.forEach(recipe => createRecipeCard(recipe));
  } catch (err) {
    console.error("Failed to load recipes:", err);
  }
}

// Favorite a recipe
async function favoriteRecipe(id) {
  try {
    const res = await fetch(`/api/recipes/${id}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Network error");
    const updated = await res.json();

    // Remove only this card after favoriting
    const card = document.getElementById(`recipe-card-${id}`);
    if (card) card.remove();

    console.log("Favorited:", updated);
  } catch (err) {
    console.error("Failed to favorite recipe:", err);
  }
}

// Run once on page load
document.addEventListener('DOMContentLoaded', loadRecipesFromDB);
