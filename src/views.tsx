import type { FC } from "hono/jsx";

type Thread = {
	id: number;
	title: string;
	created_at: string;
	last_activity_at: string;
	post_count: number;
};

type Post = {
	id: number;
	name: string;
	body: string;
	created_at: string;
};

const SITE_TITLE = "みんなの雑談掲示板";

export const Layout: FC<{ title: string; siteKey: string; children: any }> = ({
	title,
	siteKey,
	children,
}) => (
	<html lang="ja">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>{title}</title>
			<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
			<style>{`
				:root { color-scheme: light; }
				body { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; background: #f4f5f7; color: #222; margin: 0; }
				header { background: #2d5be3; color: white; padding: 16px 20px; }
				header h1 { margin: 0; font-size: 1.2rem; }
				header a { color: white; text-decoration: none; }
				main { max-width: 720px; margin: 0 auto; padding: 16px; }
				.card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
				.thread-item { display: block; padding: 12px 0; border-bottom: 1px solid #eee; text-decoration: none; color: #222; }
				.thread-item:last-child { border-bottom: none; }
				.thread-title { font-weight: 600; }
				.thread-meta { font-size: 0.8rem; color: #888; margin-top: 4px; }
				.post { padding: 10px 0; border-bottom: 1px solid #eee; }
				.post:last-child { border-bottom: none; }
				.post-meta { font-size: 0.8rem; color: #888; }
				.post-body { white-space: pre-wrap; margin-top: 4px; line-height: 1.5; }
				label { display: block; margin-top: 10px; font-size: 0.9rem; color: #444; }
				input[type=text], textarea { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; margin-top: 4px; }
				textarea { min-height: 80px; resize: vertical; }
				button { margin-top: 12px; background: #2d5be3; color: white; border: none; padding: 10px 18px; border-radius: 4px; font-size: 1rem; cursor: pointer; }
				button:hover { background: #2249c2; }
				.error { background: #fdecea; color: #b3261e; padding: 10px; border-radius: 4px; margin-bottom: 12px; }
				.back-link { display: inline-block; margin-bottom: 12px; color: #2d5be3; text-decoration: none; }
			`}</style>
		</head>
		<body>
			<header>
				<h1><a href="/">{SITE_TITLE}</a></h1>
			</header>
			<main>{children}</main>
		</body>
	</html>
);

export const ThreadListPage: FC<{ threads: Thread[]; siteKey: string; error?: string }> = ({
	threads,
	siteKey,
	error,
}) => (
	<Layout title={SITE_TITLE} siteKey={siteKey}>
		<div class="card">
			<h2>新しいスレッドを作る</h2>
			{error && <div class="error">{error}</div>}
			<form method="post" action="/threads">
				<label>
					タイトル
					<input type="text" name="title" maxlength={100} required />
				</label>
				<label>
					名前(任意)
					<input type="text" name="name" maxlength={30} placeholder="名無しさん" />
				</label>
				<label>
					本文
					<textarea name="body" maxlength={2000} required></textarea>
				</label>
				<div class="cf-turnstile" data-sitekey={siteKey}></div>
				<button type="submit">スレッドを作成</button>
			</form>
		</div>
		<div class="card">
			<h2>スレッド一覧</h2>
			{threads.length === 0 && <p>まだスレッドがありません。最初の1件を作ってみましょう。</p>}
			{threads.map((t) => (
				<a class="thread-item" href={`/threads/${t.id}`}>
					<div class="thread-title">{t.title}</div>
					<div class="thread-meta">{t.post_count}件の投稿・最終更新 {t.last_activity_at}</div>
				</a>
			))}
		</div>
	</Layout>
);

export const ThreadPage: FC<{
	thread: Thread;
	posts: Post[];
	siteKey: string;
	error?: string;
}> = ({ thread, posts, siteKey, error }) => (
	<Layout title={`${thread.title} - ${SITE_TITLE}`} siteKey={siteKey}>
		<a class="back-link" href="/">&larr; スレッド一覧に戻る</a>
		<div class="card">
			<h2>{thread.title}</h2>
			{posts.map((p, i) => (
				<div class="post">
					<div class="post-meta">{i + 1}. {p.name} - {p.created_at}</div>
					<div class="post-body">{p.body}</div>
				</div>
			))}
		</div>
		<div class="card">
			<h3>返信する</h3>
			{error && <div class="error">{error}</div>}
			<form method="post" action={`/threads/${thread.id}/posts`}>
				<label>
					名前(任意)
					<input type="text" name="name" maxlength={30} placeholder="名無しさん" />
				</label>
				<label>
					本文
					<textarea name="body" maxlength={2000} required></textarea>
				</label>
				<div class="cf-turnstile" data-sitekey={siteKey}></div>
				<button type="submit">投稿する</button>
			</form>
		</div>
	</Layout>
);
