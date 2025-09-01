// dbTest.js
import dotenv from "dotenv";
dotenv.config();

import { getAllItems } from "./db.js";
import { getExpiringSoonItems } from "./checkExpiring.js";
import { getCachedRecipe } from "./cacheRecipe.js";

// 環境変数確認
console.log("ENV:", process.env.DYNAMO_TABLE);
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "OK" : "undefined");

// DynamoDB 接続確認 & データ取得
async function testConnection() {
  try {
    const items = await getAllItems(process.env.DYNAMO_TABLE);
    console.log("✅ DynamoDB 接続成功！取得データ:");
    console.log(items);

    // 賞味期限チェック用に {name, expiryDate, quantity} を整形
    const foodItems = items
      .filter(item => (item.expiryDate || item.predicted_expiration_date) && item.name)
      .map(item => ({
        name: item.name,
        expiryDate: item.expiryDate || item.predicted_expiration_date, // 両対応
        quantity: item.quantity || 1   // 数量が無ければ1を補完
      }));

    // 賞味期限間近
    const expiringSoon = getExpiringSoonItems(foodItems);
    console.log("⚡ 今日から3日以内に賞味期限が切れる食材:");
    console.log(expiringSoon);

    // 期限間近は数量付きで表記
    const expiringIngredients = expiringSoon.map(item => `${item.quantity}個の${item.name}`);

    // 期限間近以外は名前だけ
    const otherIngredients = foodItems
      .filter(item => !expiringSoon.some(exp => exp.name === item.name))
      .map(item => item.name);

    // 材料リスト
    const ingredients = [...expiringIngredients, ...otherIngredients].sort();

    if (ingredients.length > 0) {
      try {
        const recipe = await getCachedRecipe(ingredients);
        console.log("🍳 生成されたレシピ:");
        console.log(recipe);
      } catch (err) {
        console.error("❌ レシピ生成失敗:", err);
      }
    } else {
      console.log("⚠️ 食材が見つかりませんでした。");
    }

  } catch (err) {
    console.error("❌ DynamoDB 接続失敗:", err);
  }
}

testConnection();
