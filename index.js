require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function verifyTelegramInitData(initData) {
  const token = process.env.BOT_TOKEN;
  if (!token || !initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calculated = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// Set REQUIRE_TELEGRAM_AUTH=true in production after configuring your bot.
app.post("/api/chat", upload.single("image"), async (req, res) => {
  if (process.env.REQUIRE_TELEGRAM_AUTH === "true" &&
      !verifyTelegramInitData(req.body.initData)) {
    return res.status(401).json({ error: "Telegram session could not be verified." });
  }

  const question = (req.body.question || "").trim();
  if (!question && !req.file) return res.status(400).json({ error: "سؤال یا عکس سؤال را ارسال کن." });

  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      answer: "اتصال معلم هوشمند هنوز تنظیم نشده است. مدیر پروژه باید کلید سرویس هوش مصنوعی را در فایل .env وارد کند. فعلاً می‌توانی بخش درس‌ها و آزمون نمونه را امتحان کنی."
    });
  }

  try {
    const content = [];
    if (question) content.push({ type: "input_text", text: question });
    if (req.file) {
      const mime = req.file.mimetype;
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        return res.status(400).json({ error: "فرمت عکس باید JPG، PNG یا WEBP باشد." });
      }
      const dataUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
      content.push({ type: "input_image", image_url: dataUrl });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: "تو KherdYar، یک معلم مهربان و دقیق برای دانش‌آموز پایه هشتم هستی. به فارسی ساده پاسخ بده. راه‌حل را مرحله‌به‌مرحله توضیح بده، فقط جواب نهایی نده. اگر تصویر سؤال ناخواناست، درخواست عکس واضح‌تر کن. اگر موضوع خارج از درس است، محترمانه بگو تمرکزت آموزش است.",
        input: [{ role: "user", content }]
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("AI provider error:", detail);
      return res.status(502).json({ error: "فعلاً معلم هوشمند پاسخ‌گو نیست. کمی بعد دوباره تلاش کن." });
    }
    const data = await response.json();
    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");
    res.json({ answer: answer || "پاسخی دریافت نشد؛ دوباره تلاش کن." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای داخلی سرور رخ داد." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "KherdYar" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`KherdYar running on http://localhost:${port}`));