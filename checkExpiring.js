// checkExpiring.js
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * 賞味期限が今日〜3日以内の食材を抽出
 * @param {Array} items - 賞味期限データを含むアイテム配列
 * @returns {Array} - 賞味期限間近のアイテム配列
 */
export function getExpiringSoonItems(items) {
  const today = dayjs().startOf("day");
  const targetDate = today.add(3, "day");

  console.log("📅 === 賞味期限チェック開始 ===");
  console.log("📅 今日:", today.format("YYYY-MM-DD"));
  console.log("📅 判定範囲: 今日〜", targetDate.format("YYYY-MM-DD"));
  console.log("📅 入力データ数:", items.length);

  const result = items.filter((item, index) => {
    const rawExpiryDate = item.expiryDate || item.predicted_expiration_date;
    const expiryDate = dayjs(rawExpiryDate, "YYYY-MM-DD").startOf("day");

    // 日付が無効なものは除外
    if (!expiryDate.isValid()) {
      console.log(`⚠️ [${index + 1}] ${item.name}: 無効な日付 (${rawExpiryDate})`);
      return false;
    }

    const isAfterToday = expiryDate.isSameOrAfter(today, "day");
    const isBeforeTarget = expiryDate.isSameOrBefore(targetDate, "day");
    const isExpiringSoon = isAfterToday && isBeforeTarget;

    console.log(`📊 [${index + 1}] ${item.name}:`);
    console.log(`    生データ: ${rawExpiryDate}`);
    console.log(`    解析後: ${expiryDate.format("YYYY-MM-DD")}`);
    console.log(`    今日以降: ${isAfterToday}`);
    console.log(`    3日以内: ${isBeforeTarget}`);
    console.log(`    → 賞味期限間近: ${isExpiringSoon}`);
    console.log("    ---");

    return isExpiringSoon;
  });

  console.log(
    "⚠️ 最終結果:",
    result.map(i => `${i.name}(${i.expiryDate || i.predicted_expiration_date})`)
  );
  console.log("📅 === 賞味期限チェック終了 ===");

  return result;
}
