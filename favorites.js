const recipeBox = document.getElementById('recipeBox');



window.onload = () => {
  loadFavoritesFromDB();
}

recipeBox.addEventListener('wheel', (e) => {
  // Only act when the cursor is over the box
  e.preventDefault();                       // stop the page from vertical scrolling
  recipeBox.scrollLeft += e.deltaY;         // convert vertical scroll to horizontal
}, { passive: false }); // passive:false lets us call preventDefault

async function loadFavoritesFromDB() {
  try {
    const response = await fetch('http://localhost:3000/api/recipes/getFavorites');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const dbRecipes = await response.json();
    dbRecipes.forEach(recipe => createRecipeCard(recipe));
  } catch (err) {
    console.error("Failed to load favorites:", err);
  }
}

async function removeFavorite(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/recipes/${id}/unfavorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Network error");
    const updated = await res.json();
    console.log("Removed favorite:", updated);
  } catch (err) {
    console.error("Failed to remove favorite:", err);
  }
}

function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  card.innerHTML = `
    <a>
      <img src="${recipe.image}" alt="${recipe.title}" />
      <h3>${recipe.title}</h3>
    </a>
    
    <div class="buttonBox">
       <button
    id="view-recipe-button-${recipe._id}"
    class="view-recipe-button"
    onclick="window.open('${recipe.link || recipe.instructions}', '_blank')"
  >
    View Recipe
  </button>
  
      <button id="remove-favorite-button" onclick="removeFavorite('${recipe._id}')">
      Remove Favorite
      </button>  
    </div>
  `;

  recipeBox.appendChild(card);
}
