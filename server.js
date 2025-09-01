import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAllItems } from "./db.js";
import { getExpiringSoonItems } from "./checkExpiring.js";
import { generateRecipe } from "./recipeService.js";

dotenv.config({ debug: false });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS設定
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

app.use(express.json());

const port = process.env.PORT || 5000;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));

// ─── データ処理関数 ───
function processInventoryAndExpiryData(items) {
  const inventoryItems = items
    .filter(item => item.sk && item.sk.startsWith('INV#FOOD#') && typeof item.quantity === 'number' && item.quantity > 0);

  const pantryItems = items
    .filter(item => item.type === 'pantry' && item.food_key && item.expiryDate && item.name);

  const mergedData = [];

  inventoryItems.forEach(invItem => {
    const englishName = invItem.sk.replace('INV#FOOD#', '');
    const relatedPantryItems = pantryItems.filter(pItem => pItem.food_key === englishName);

    if (relatedPantryItems.length > 0) {
      relatedPantryItems.forEach(pantryItem => {
        mergedData.push({
          name: pantryItem.name,
          englishName: englishName,
          quantity: Math.floor(invItem.quantity / relatedPantryItems.length) || 1,
          expiryDate: pantryItem.expiryDate,
          updated_at: invItem.updated_at,
          pantryId: pantryItem.sk
        });
      });
    } else {
      mergedData.push({
        name: englishName,
        englishName: englishName,
        quantity: invItem.quantity,
        expiryDate: null,
        updated_at: invItem.updated_at
      });
    }
  });

  return {
    inventoryOnly: mergedData.filter(item => item.expiryDate === null),
    withExpiry: mergedData.filter(item => item.expiryDate !== null),
    allItems: mergedData
  };
}

// ─── 賞味期限チェック＆レシピ生成 API ───
app.get("/api/data", async (req, res) => {
  try {
    const tableName = process.env.DYNAMO_TABLE || "AppTable";
    const items = await getAllItems(tableName);
    const processedData = processInventoryAndExpiryData(items);

    const expiringSoon = processedData.withExpiry.length > 0 
      ? getExpiringSoonItems(processedData.withExpiry)
      : [];

    console.log("⚠️ 賞味期限間近:", expiringSoon);

    let recipeText = null;
    let imageUrl = null;

    // expiringSoon が空でなければレシピ生成
    if (expiringSoon.length > 0) {
      const ingredients = expiringSoon
        .filter(item => item.name)
        .map(item => `${item.name} ${Number(item.quantity) || 1}個`);

      if (ingredients.length > 0) {
        try {
          const recipeResult = await generateRecipe(ingredients);
          recipeText = recipeResult.recipeText;
          imageUrl = recipeResult.imageUrl || null;
        } catch (recipeError) {
          console.error("🍳 レシピ生成エラー:", recipeError);
        }
      }
    } else {
      // 空の場合は生成せずメッセージだけ
      recipeText = "賞味期限間近食材はありません。";
      imageUrl = null;
    }

    res.json({
      success: true,
      inventory: processedData.allItems,
      expiringSoon,
      recipeText,
      imageUrl,
      forbiddenList: expiringSoon,
      message: expiringSoon.length === 0 ? "賞味期限間近食材はありません。" : undefined
    });

  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ─── 在庫のみ取得 API ───
app.get("/api/inventory", async (req, res) => {
  try {
    const tableName = process.env.DYNAMO_TABLE || "AppTable";
    const items = await getAllItems(tableName);
    const processedData = processInventoryAndExpiryData(items);

    res.json({
      success: true,
      inventory: processedData.allItems
    });

  } catch (err) {
    console.error("❌ Inventory API error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ─── デバッグ用 API ───
app.get("/api/debug", async (req, res) => {
  try {
    const tableName = process.env.DYNAMO_TABLE || "AppTable";
    const items = await getAllItems(tableName);

    res.json({
      success: true,
      raw_data: items,
      processed_data: processInventoryAndExpiryData(items)
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    });
  }
});

// ─── ルートアクセス ───
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── サーバー起動 ───
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`🍳 レシピ生成: http://localhost:${port}/api/data`);
  console.log(`📦 在庫確認: http://localhost:${port}/api/inventory`);
});
