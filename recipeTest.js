// recipeTest.js
import { generateRecipe } from "./recipeService.js";

async function test() {
  const result = await generateRecipe(["リンゴ", "バナナ"]);
  console.log("🍳 レシピ生成結果:", result);
}

test();
