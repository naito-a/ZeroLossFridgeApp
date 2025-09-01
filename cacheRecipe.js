// cacheRecipe.js
import fs from "fs";
import OpenAI from "openai";
import { generateRecipe } from "./recipeService.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CACHE_FILE = "./lastRecipe.json";

/**
 * 食材リストに基づき、キャッシュまたは新規生成したレシピを返す
 * @param {string[]} ingredients
 * @returns {Promise<{recipeText: string, title: string, imageUrl: string | null}>}
 */
export async function getCachedRecipe(ingredients) {
  if (!ingredients || ingredients.length === 0) {
    console.log("⚠️ 賞味期限間近食材なし → レシピ生成スキップ");
    return {
      recipeText: "賞味期限間近食材はありません。",
      title: "賞味期限間近食材なし",
      imageUrl: null,
    };
  }

  let cache = {};

  // ─── キャッシュ確認 ───
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));

      if (JSON.stringify(cache.ingredients) === JSON.stringify(ingredients)) {
        console.log("✅ キャッシュからレシピを取得");
        return {
          recipeText: cache.recipe,
          title: cache.title,
          imageUrl: cache.imageUrl || null,
        };
      }
    } catch (err) {
      console.error("⚠️ キャッシュファイル読み込みエラー:", err.message);
      // キャッシュが壊れていても新規生成に進む
    }
  }

  // ─── 新規レシピ生成 ───
  console.log("🆕 新しいレシピを生成中...");
  const recipeResult = await generateRecipe(ingredients);

  const recipeText = recipeResult.recipeText || "";
  let imageUrl = recipeResult.imageUrl || null;

  // ─── タイトル抽出 ───
  let title = "料理レシピ";
  if (recipeText.includes("###")) {
    const firstLine = recipeText.split("\n")[0];
    title = firstLine.replace(/#+\s*/, "").trim();
  } else if (recipeText.includes("**")) {
    const titleMatch = recipeText.match(/\*\*(.*?)\*\*/);
    if (titleMatch) title = titleMatch[1];
  }

  // ─── 画像生成（recipeService で未生成の場合のみ）───
  if (!imageUrl && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "DUMMY") {
    try {
      console.log("🖼️ 追加画像生成を開始...");
      const prompt = `A photorealistic food photo of a home-cooked dish made with ${ingredients.slice(0, 3).join(", ")}, beautifully plated, appetizing presentation, high-quality food photography`;

      const image = await client.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "standard",
      });

      imageUrl = image.data[0].url;
      console.log("✅ 追加画像生成完了");
    } catch (err) {
      console.error("❌ 追加画像生成エラー:", err.message);
    }
  }

  // ─── キャッシュ保存 ───
  try {
    const cacheData = {
      ingredients,
      recipe: recipeText,
      title,
      imageUrl,
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log("💾 レシピをキャッシュファイルに保存");
  } catch (err) {
    console.error("⚠️ キャッシュファイル保存エラー:", err.message);
  }

  return { recipeText, title, imageUrl };
}
