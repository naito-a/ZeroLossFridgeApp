// recipeService.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "DUMMY") {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * レシピ生成
 * @param {string[]} ingredients - 食材リスト（賞味期限間近の食材が先頭に並んでいる想定）
 * @returns {Promise<{recipeText: string, imageUrl: string|null}>} - 生成されたレシピ文と画像URL
 */
export async function generateRecipe(ingredients) {
  // 🛑 空配列なら即終了
  if (!ingredients || ingredients.length === 0) {
    return {
      recipeText: "賞味期限間近食材はありません。",
      imageUrl: null
    };
  }

  // APIキーが無効な場合はダミーレシピ
  if (!openai) {
    return {
      recipeText: `ダミーレシピ: ${ingredients.join(", ")} を使った料理`,
      imageUrl: null
    };
  }

  // ─── テキストレシピ生成用プロンプト ───
  const ingredientList = ingredients.join(", ");
  const prompt = `
以下の食材を使って、子どもも食べやすい簡単なレシピを作成してください。
賞味期限が近い食材は必ず先に使い、残りの食材も活用してください。
食材: ${ingredientList}

・手順は3〜5ステップ程度に簡潔に。
・調理時間は30分以内。
・冷凍保存できるかどうかも簡単に記載。
・レシピの最初に料理名を明記してください。
`;

  let recipeText = "⚠️ レシピが生成されませんでした";
  let imageUrl = null;

  try {
    // ─── レシピ生成 ───
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたはプロの料理人です。三ツ星レストランで総料理長をしています。" },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 500,
      response_format: { type: "text" }
    });

    recipeText = completion.choices[0]?.message?.content?.trim() || recipeText;

    // ─── 料理名抽出 ───
    let dishName = "";
    try {
      const lines = recipeText.split("\n");
      const firstLine = lines[0] || "";
      if (firstLine.startsWith("#")) {
        dishName = firstLine.replace(/^#+\s*/, "").trim();
      } else {
        dishName = firstLine.trim();
      }
    } catch (err) {
      console.log("料理名抽出エラー:", err);
      dishName = `dish with ${ingredientList}`;
    }

    // ─── 手順から調理方法を抽出 ───
    let methodHints = "";
    try {
      const lines = recipeText.split("\n").slice(1).join(" ");
      const keywords = [];
      if (/切|刻|スライス/.test(lines)) keywords.push("sliced");
      if (/炒め|ソテー|焼/.test(lines)) keywords.push("stir-fried or grilled");
      if (/煮|茹/.test(lines)) keywords.push("boiled or simmered");
      if (/蒸/.test(lines)) keywords.push("steamed");
      methodHints = keywords.length > 0 ? `The dish should look ${keywords.join(", ")}.` : "";
    } catch (err) {
      console.log("調理法抽出エラー:", err);
    }

    // ─── 画像生成 ───
    try {
      const imagePrompt = `
A photorealistic food photo of ${dishName}, beautifully plated and ready to eat.
${methodHints}
All fruits and vegetables are peeled and properly prepared before plating (no skins, no peels).
Appetizing presentation, high-quality food photography, professional natural lighting.
`;

      const negativePrompt = `
whole apple, banana peel, fruit skin, raw, unpeeled, plastic, artificial, cartoon, 3d render, unrealistic
`;

      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${imagePrompt}\n\nAvoid: ${negativePrompt}`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      imageUrl = imageRes.data[0].url || null;
    } catch (imgErr) {
      console.error("❌ 画像生成エラー:", imgErr);
      imageUrl = null;
    }

    return { recipeText, imageUrl };
  } catch (err) {
    console.error("❌ OpenAIエラー:", err);
    return {
      recipeText: "⚠️ レシピ生成中にエラーが発生しました。",
      imageUrl: null
    };
  }
}
