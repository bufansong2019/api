export function localTime(): string {
	const d = new Date();
	// UTC+8 (Asia/Shanghai)
	const utc8 = new Date(d.getTime() + 8 * 3600 * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");
	return utc8.getUTCFullYear() + "-" + pad(utc8.getUTCMonth() + 1) + "-" + pad(utc8.getUTCDate())
		+ " " + pad(utc8.getUTCHours()) + ":" + pad(utc8.getUTCMinutes()) + ":" + pad(utc8.getUTCSeconds());
}

export function base64Url(str: string): string {
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
		"deriveBits",
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100_000, hash: "SHA-256" },
		key,
		256,
	);
	return base64Url(new Uint8Array(bits).reduce((s, b) => s + String.fromCharCode(b), ""));
}
