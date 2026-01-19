// costing.js
function getRecipeForProduct(productId){
  return recipes.find(r => r.ingredients.some(i => i.productId === productId));
}
