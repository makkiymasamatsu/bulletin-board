// NGワード(必要に応じて追加してください)
const NG_WORDS = ["死ね", "殺す", "ぶっ殺"];

export function containsNgWord(text: string): boolean {
	const lower = text.toLowerCase();
	return NG_WORDS.some((w) => lower.includes(w.toLowerCase()));
}

export async function hashIp(ip: string, salt: string): Promise<string> {
	const data = new TextEncoder().encode(salt + ip);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function verifyTurnstile(
	token: string,
	secretKey: string,
	ip: string,
): Promise<boolean> {
	if (!token) return false;
	const body = new FormData();
	body.append("secret", secretKey);
	body.append("response", token);
	body.append("remoteip", ip);

	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{ method: "POST", body },
	);
	const outcome = (await res.json()) as { success: boolean };
	return outcome.success;
}
