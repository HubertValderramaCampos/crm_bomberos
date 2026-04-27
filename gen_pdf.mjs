import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "guia_bomberos.html");
const pdfPath  = path.join(__dirname, "guia_bomberos.pdf");

const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();
await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  margin: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2.5cm" },
  printBackground: true,
});
await browser.close();
console.log("PDF generado:", pdfPath);
