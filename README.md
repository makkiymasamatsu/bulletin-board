# みんなの雑談掲示板

Cloudflare Workers + D1 + Hono で作った、匿名投稿OKの雑談掲示板です。

## 公開URL

https://bulletin-board.chat-room42.workers.dev

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

Turnstile(サイトキー・シークレットキー)は本番用のものを発行済みです。サイトキーは `wrangler.jsonc` の `vars.TURNSTILE_SITE_KEY` に、シークレットキーはCloudflareダッシュボードの Workers & Pages → bulletin-board → Settings → Runtime variables and secrets にSecretとして設定しています。

キーを再発行した場合は、以下の手順で更新してください。

```bash
# wrangler.jsonc の vars.TURNSTILE_SITE_KEY を新しいサイトキーに書き換える
npx wrangler secret put TURNSTILE_SECRET_KEY
```
