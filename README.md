# みんなの雑談掲示板

Cloudflare Workers + D1 + Hono で作った、匿名投稿OKの雑談掲示板です。

## 構成

- フレームワーク: [Hono](https://hono.dev/)
- ホスティング: Cloudflare Workers
- データベース: Cloudflare D1
- スパム対策: Cloudflare Turnstile(CAPTCHA代替)+ 投稿間隔のレート制限 + NGワードフィルタ

## ローカル開発

```bash
npm install
npx wrangler d1 execute bulletin-board-db --local --file=schema.sql
npm run dev
```

`.dev.vars` にローカル用の環境変数(Turnstileのテスト用シークレットキーなど)が入っています。

## デプロイ

GitHubリポジトリにpushすると、Cloudflareの自動デプロイが実行されます。

本番用のTurnstileキー(サイトキー・シークレットキー)を発行したら、以下を設定してください。

```bash
# wrangler.jsonc の vars.TURNSTILE_SITE_KEY を本番のサイトキーに書き換える
npx wrangler secret put TURNSTILE_SECRET_KEY
```
