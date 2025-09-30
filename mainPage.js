const ingredientList = document.getElementById("ingredientList");
const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const ingredientsAdded = document.getElementById("ingredientsAdded");
const recipeBox = document.getElementById("recipeBox");
const ingredientsListDropdown = document.getElementById("ingredientList");

let selectedIngredients = []; // This will store all user-selected ingredients
let recipes = [];
let foundRecipes = [];

recipeBox.addEventListener('wheel', (e) => {
  // Only act when the cursor is over the box
  e.preventDefault();                       // stop the page from vertical scrolling
  recipeBox.scrollLeft += e.deltaY;         // convert vertical scroll to horizontal
}, { passive: false }); // passive:false lets us call preventDefault


//Search Button | Looks Up Recipes
searchButton.addEventListener("click", () => {
  //checkIfRecipeExists();       // still checks your hardcoded list
  //fetchRecipesFromAPI(5);       // NEW: fetch live recipes
  loadRecipesFromDB();      // NEW: fetch all recipes from MongoDB
});

// Add ingredient when selected from dropdown
ingredientsListDropdown.addEventListener("change", () => {
  const ingredient = ingredientsListDropdown.value;
  if (ingredient !== "0" && !selectedIngredients.includes(ingredient)) {
    selectedIngredients.push(ingredient);
    ingredientsAdded.textContent = selectedIngredients.join(", ");
  }
  ingredientsListDropdown.value = "0";
});

// Reset button to clear ingredients added
resetButton.addEventListener("click", () => {
    selectedIngredients = [];
    foundRecipes = [];
    ingredientsAdded.textContent = "Ingredients Will Appear Here";
    recipeBox.innerHTML = "";
});


function checkIfRecipeExists() {
  const pantryItems = ["salt","pepper","oil","flour","water","sugar"];
  recipeBox.innerHTML = "";      // clear previous
  foundRecipes = [];

  recipes.forEach(recipe => {
    const match =
      recipe.ingredients.every(ing =>
        selectedIngredients.includes(ing) || pantryItems.includes(ing.toLowerCase())
      ) &&
      selectedIngredients.every(ing =>
        recipe.ingredients.includes(ing) || pantryItems.includes(ing.toLowerCase())
      );

    if (match && !foundRecipes.includes(recipe)) {
      foundRecipes.push(recipe);
      createRecipeCard(recipe);
    }
  });
}

//Recipe Cards
function createRecipeCard(recipe) {
  // give each card a unique id so we can target it later
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.id = `recipe-card-${recipe._id}`;   // <-- unique id

  // each card must also have a unique favorite-button id
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


//API SHENANIGANS---------------------------------------------------------------------------
async function fetchRecipesFromAPI(numRecipes = 1) {
  if (!selectedIngredients || selectedIngredients.length === 0) {
    console.warn("No ingredients selected. Aborting fetch.");
    return;
  }

  const apiKey = "ca454663a99e4d91b9ee6b08c7532dfc"; // replace with your key
  const query = selectedIngredients.join(",");
  const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=50&apiKey=${apiKey}`;

  try {
    console.log("Fetching recipes for:", query);
    const response = await fetch(spoonacularUrl);

    if (!response.ok) {
      console.error("Spoonacular API error:", response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} recipes from Spoonacular`);

    // Shuffle the results
    const shuffled = data.sort(() => Math.random() - 0.5);

    // Process the first `numRecipes`
    const recipesToInsert = [];

    for (const r of shuffled.slice(0, numRecipes)) {
      const recipeObj = {
        title: r.title,
        image: r.image,
        ingredients: [...selectedIngredients],
        link: `https://spoonacular.com/recipes/${r.title.replace(/\s+/g, "-")}-${r.id}`
      };

      // Avoid duplicates locally
      if (!foundRecipes.find(fr => fr.title === recipeObj.title)) {
        foundRecipes.push(recipeObj);
        createRecipeCard(recipeObj);
        recipesToInsert.push(recipeObj);
      }
    }

    if (recipesToInsert.length > 0) {
      try {
        const backendUrl = "http://localhost:3000/recipes"; // change if your backend is on another port
        const res = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipesToInsert)
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to save recipes:", text);
          return;
        }

        const saved = await res.json();
        console.log("Saved recipes to DB:", saved.map(r => r.title));
      } catch (dbError) {
        console.error("Error inserting recipes into MongoDB:", dbError);
      }
    } else {
      console.log("No new recipes to insert");
    }

  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}

//Pull from MongoDB ------------------------------------------------------------------------------
async function loadRecipesFromDB(numToShow = 5, append = false, excludeIds = []) {
  try {
    const response = await fetch('http://localhost:3000/api/recipes');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const dbRecipes = await response.json();

    if (!append) recipeBox.innerHTML = "";

    const pantryItems = ["salt","pepper","oil","flour","water","sugar"];
    const matchingRecipes = dbRecipes.filter(recipe => {
      if (recipe.isFavorite) return false;
      if (excludeIds.includes(recipe._id)) return false; // skip removed cards
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

async function favoriteRecipe(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/recipes/${id}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Network error");
    const updated = await res.json();

    // remove only this card
    const card = document.getElementById(`recipe-card-${id}`);
    if (card) card.remove();

    console.log("Favorited:", updated);
  } catch (err) {
    console.error("Failed to favorite recipe:", err);
  }
}

// Run once on page load
document.addEventListener('DOMContentLoaded', loadRecipesFromDB);




















