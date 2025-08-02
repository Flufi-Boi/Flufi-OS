export function generateID(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
    return new Array(5).fill("").map(_ => chars[Math.floor((Math.random() % 1) * chars.length)]).join("");
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}