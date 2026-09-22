import { Hono } from "hono";
import { containsNgWord, hashIp, verifyTurnstile } from "./lib";
import { ThreadListPage, ThreadPage } from "./views";

type Bindings = {
	DB: D1Database;
	TURNSTILE_SITE_KEY: string;
	TURNSTILE_SECRET_KEY: string;
	IP_HASH_SALT: string;
};

const RATE_LIMIT_SECONDS = 10;

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		`SELECT t.id, t.title, t.created_at, t.last_activity_at,
		        (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) AS post_count
		 FROM threads t
		 ORDER BY t.last_activity_at DESC
		 LIMIT 50`,
	).all();

	return c.html(
		<ThreadListPage threads={results as any} siteKey={c.env.TURNSTILE_SITE_KEY} />,
	);
});

app.post("/threads", async (c) => {
	const form = await c.req.formData();
	const title = String(form.get("title") ?? "").trim();
	const name = String(form.get("name") ?? "").trim() || "名無しさん";
	const body = String(form.get("body") ?? "").trim();
	const token = String(form.get("cf-turnstile-response") ?? "");
	const ip = c.req.header("cf-connecting-ip") ?? "unknown";

	const renderError = async (error: string) => {
		const { results } = await c.env.DB.prepare(
			`SELECT t.id, t.title, t.created_at, t.last_activity_at,
			        (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) AS post_count
			 FROM threads t ORDER BY t.last_activity_at DESC LIMIT 50`,
		).all();
		return c.html(
			<ThreadListPage
				threads={results as any}
				siteKey={c.env.TURNSTILE_SITE_KEY}
				error={error}
			/>,
			400,
		);
	};

	if (!title || !body) return renderError("タイトルと本文を入力してください。");
	if (title.length > 100 || body.length > 2000)
		return renderError("文字数が上限を超えています。");
	if (containsNgWord(title) || containsNgWord(body))
		return renderError("不適切な言葉が含まれています。");

	const ok = await verifyTurnstile(token, c.env.TURNSTILE_SECRET_KEY, ip);
	if (!ok) return renderError("認証に失敗しました。もう一度お試しください。");

	const ipHash = await hashIp(ip, c.env.IP_HASH_SALT);
	const recent = await c.env.DB.prepare(
		`SELECT id FROM posts WHERE ip_hash = ? AND created_at > datetime('now', ?) LIMIT 1`,
	)
		.bind(ipHash, `-${RATE_LIMIT_SECONDS} seconds`)
		.first();
	if (recent) return renderError("連続投稿はできません。少し時間をおいてください。");

	const thread = await c.env.DB.prepare(
		`INSERT INTO threads (title) VALUES (?) RETURNING id`,
	)
		.bind(title)
		.first<{ id: number }>();

	await c.env.DB.prepare(
		`INSERT INTO posts (thread_id, name, body, ip_hash) VALUES (?, ?, ?, ?)`,
	)
		.bind(thread!.id, name, body, ipHash)
		.run();

	return c.redirect(`/threads/${thread!.id}`);
});

app.get("/threads/:id", async (c) => {
	const id = Number(c.req.param("id"));
	const thread = await c.env.DB.prepare(
		`SELECT id, title, created_at, last_activity_at FROM threads WHERE id = ?`,
	)
		.bind(id)
		.first();
	if (!thread) return c.notFound();

	const { results: posts } = await c.env.DB.prepare(
		`SELECT id, name, body, created_at FROM posts WHERE thread_id = ? ORDER BY id ASC`,
	)
		.bind(id)
		.all();

	return c.html(
		<ThreadPage
			thread={thread as any}
			posts={posts as any}
			siteKey={c.env.TURNSTILE_SITE_KEY}
		/>,
	);
});

app.post("/threads/:id/posts", async (c) => {
	const id = Number(c.req.param("id"));
	const form = await c.req.formData();
	const name = String(form.get("name") ?? "").trim() || "名無しさん";
	const body = String(form.get("body") ?? "").trim();
	const token = String(form.get("cf-turnstile-response") ?? "");
	const ip = c.req.header("cf-connecting-ip") ?? "unknown";

	const thread = await c.env.DB.prepare(
		`SELECT id, title, created_at, last_activity_at FROM threads WHERE id = ?`,
	)
		.bind(id)
		.first();
	if (!thread) return c.notFound();

	const renderError = async (error: string) => {
		const { results: posts } = await c.env.DB.prepare(
			`SELECT id, name, body, created_at FROM posts WHERE thread_id = ? ORDER BY id ASC`,
		)
			.bind(id)
			.all();
		return c.html(
			<ThreadPage
				thread={thread as any}
				posts={posts as any}
				siteKey={c.env.TURNSTILE_SITE_KEY}
				error={error}
			/>,
			400,
		);
	};

	if (!body) return renderError("本文を入力してください。");
	if (body.length > 2000) return renderError("文字数が上限を超えています。");
	if (containsNgWord(body)) return renderError("不適切な言葉が含まれています。");

	const ok = await verifyTurnstile(token, c.env.TURNSTILE_SECRET_KEY, ip);
	if (!ok) return renderError("認証に失敗しました。もう一度お試しください。");

	const ipHash = await hashIp(ip, c.env.IP_HASH_SALT);
	const recent = await c.env.DB.prepare(
		`SELECT id FROM posts WHERE ip_hash = ? AND created_at > datetime('now', ?) LIMIT 1`,
	)
		.bind(ipHash, `-${RATE_LIMIT_SECONDS} seconds`)
		.first();
	if (recent) return renderError("連続投稿はできません。少し時間をおいてください。");

	await c.env.DB.prepare(
		`INSERT INTO posts (thread_id, name, body, ip_hash) VALUES (?, ?, ?, ?)`,
	)
		.bind(id, name, body, ipHash)
		.run();

	await c.env.DB.prepare(
		`UPDATE threads SET last_activity_at = datetime('now') WHERE id = ?`,
	)
		.bind(id)
		.run();

	return c.redirect(`/threads/${id}`);
});

export default app;
