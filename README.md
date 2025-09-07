# 賞味期限間近食材レシピジェネレーター

食材の賞味期限を管理し、期限が近い食材を使った子ども向けレシピを自動生成するWebアプリケーションです。

## ✨ 主な機能

- **食材管理**: 食材名と賞味期限を登録・管理
- **自動レシピ生成**: OpenAI GPTを使用して、賞味期限間近の食材を優先したレシピを自動生成
- **料理写真生成**: DALL-E 3による美味しそうな料理写真の自動生成
- **子ども向け**: 子どもも食べやすい簡単なレシピに特化
- **冷凍保存情報**: 作り置きに便利な冷凍保存の可否も表示

## 🛠 技術スタック

### フロントエンド
- **HTML5** - マークアップ
- **CSS3** - スタイリング
- **JavaScript (ES6+)** - クライアントサイドロジック

### バックエンド
- **Node.js** - サーバーサイド実行環境
- **Express.js** - Webフレームワーク

### データソース・API
- **AWS** - データ取得元
- **OpenAI GPT-4o-mini** - レシピテキスト生成
- **OpenAI DALL-E 3** - 料理写真生成

## 📦 インストール

1. リポジトリをクローンします：
```bash
git clone https://github.com/your-username/recipe-generator.git
cd recipe-generator
```

2. 依存関係をインストールします：
```bash
npm install
```

3. 環境変数を設定します：
```bash
cp .env.example .env
```

`.env`ファイルを編集し、OpenAI APIキーを設定してください：
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

## 🚀 使用方法

1. サーバーを起動：
```bash
npm start
```

2. ブラウザで `http://localhost:5000` にアクセス

## 📝 基本的な操作

1. **食材を追加**: 食材名と賞味期限を入力して「追加」ボタンをクリック
2. **レシピ生成**: 「レシピを生成」ボタンをクリックすると、賞味期限間近の食材を使ったレシピが生成されます
3. **食材管理**: 不要な食材は「削除」ボタンで削除できます

## 🏗 プロジェクト構成

```
recipe-generator/
├── public/               # 静的ファイル（HTML, CSS, JS）
├── .gitignore           # Git除外設定
├── cacheRecipe.js       # レシピキャッシュ機能
├── checkExpiring.js     # 賞味期限チェック機能
├── db.js                # データベース設定
├── dbTest.js            # データベーステスト
├── lastRecipe.json      # 最後に生成したレシピ
├── nameMap.js           # 食材名マッピング
├── package-lock.json    # 依存関係ロック
├── package.json         # 依存関係
├── recipeService.js     # OpenAI API呼び出しロジック
├── recipeTest.js        # レシピ生成テスト
└── server.js            # Express サーバー
```

## 🔧 API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|-----|
| GET | `/api/ingredients` | AWS から食材データを取得 |
| POST | `/api/ingredients` | 新しい食材を追加 |
| DELETE | `/api/ingredients/:id` | 指定IDの食材を削除 |
| POST | `/api/generate-recipe` | レシピを生成 |

## 🔍 APIキーについて

このアプリケーションはOpenAI APIを使用しています：
- GPT-4o-mini: レシピテキストの生成
- DALL-E 3: 料理写真の生成

---

**Note**: このアプリケーションはOpenAI APIキーが必要です。使用量に応じて料金が発生する可能性があります。