import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
import { loadLocalTs } from "./lib/load-local-ts.mjs";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const { localDate, addDays, HABITS_KEY, RETURN_MESSAGE } = loadLocalTs("lib/habits.ts");
const root = resolve("out");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer((request, response) => {
  let file = resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
  if (!file.startsWith(root + sep) && file !== root) { response.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, "index.html");
  if (!existsSync(file)) { response.writeHead(404).end(); return; }
  response.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream");
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const address = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 720 }, locale: "pt-BR" });
  await context.route("**/*", (route) => route.request().url().startsWith(address) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${address}/habitos/`);
  await page.getByRole("button", { name: "Salvar registro", exact: true }).waitFor();
  await page.locator('input[name="pages"]').fill("0");
  await page.locator('input[name="instagramMinutes"]').fill("0");
  await page.locator('input[name="disposition"]').fill("0");
  await page.getByRole("button", { name: "Salvar registro", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Salvar registro", exact: true }).waitFor();
  assert.equal(await page.locator('input[name="pages"]').inputValue(), "0");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), HABITS_KEY);
  assert.equal(saved.entries[localDate()].pages, 0);
  assert.equal(saved.entries[localDate()].bedtime, undefined);
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page.locator('input[name="startDate"]').fill(addDays(localDate(), -9));
  await page.getByRole("button", { name: "Salvar ajustes", exact: true }).click();
  await page.getByRole("button", { name: "Registro", exact: true }).click();
  await page.locator('input[name="minimumDone"]').check();
  await page.locator('select[name="youtube"]').selectOption("reactive");
  await page.getByRole("button", { name: "Salvar registro", exact: true }).click();
  await page.getByText(RETURN_MESSAGE, { exact: false }).waitFor();
  mkdirSync("outputs/habits", { recursive: true });
  for (const viewport of [{ width: 390, height: 720 }, { width: 375, height: 667 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.getByRole("button", { name: "Salvar registro", exact: true }).boundingBox();
    assert(bounds.y + bounds.height <= viewport.height, `Registro excede a tela ${viewport.width}x${viewport.height}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Overflow horizontal");
    await page.screenshot({ path: `outputs/habits/registro-${viewport.width}.png`, fullPage: true });
  }
  const original = await page.evaluate((key) => localStorage.getItem(key), HABITS_KEY);
  await page.getByRole("button", { name: "Ver exemplo", exact: true }).click();
  await page.getByText("5/7 dias decorridos com registro", { exact: true }).waitFor();
  await page.getByText("Meta cumprida pela versão mínima em 3 dia(s) desta semana.", { exact: true }).waitFor();
  assert.equal(await page.locator("iframe").count(), 0, "Feed não pode aparecer na página");
  await page.screenshot({ path: "outputs/habits/revisao-demo.png", fullPage: true });
  const downloadWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar revisão em Markdown" }).click();
  const download = await downloadWait;
  await download.saveAs("outputs/habits/revisao-exemplo.md");
  assert(readFileSync("outputs/habits/revisao-exemplo.md", "utf8").includes("sem registro"));
  await page.getByRole("button", { name: "Semana anterior" }).click();
  await page.getByText("6/7 dias decorridos com registro", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Semana anterior" }).click();
  await page.getByText("5/7 dias decorridos com registro", { exact: true }).waitFor();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), HABITS_KEY), original, "Demo alterou o diário real");
  await page.getByRole("button", { name: "Sair da demo", exact: true }).click();
  // Simulate malformed storage only inside this isolated browser context.
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), HABITS_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Baixar cópia original" }).waitFor();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), HABITS_KEY), "{broken");
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("UI OK: persistência de zero, campos opcionais, versão mínima, retorno acolhedor, uma tela em 3 tamanhos, demo isolada, 3 semanas, exportação e dados corrompidos preservados. Sem erros de página.");
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
