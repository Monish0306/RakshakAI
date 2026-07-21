import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST" });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ success: false, error: "Missing imageBase64 data" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      data: {
        isRelevant: true,
        detectedType: "unknown",
        description: "Vision API key missing — bypassed relevance check.",
        extractedText: "",
        degraded: true,
        degradedReason: "missing_api_key"
      },
      error: null,
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageMime = mimeType || "image/png";

  const prompt = `You are a screenshot classifier for a digital arrest and cyber scam detection app.
Examine this image and perform a strict 2-part check:
1. Is this image a RELEVANT screenshot related to a potential scam or digital interaction? (e.g. Chat app conversation like WhatsApp/Telegram/SMS, Bank transfer UI, Phone call screen, UPI payment request, Official notice, or SMS alert). Or is it an IRRELEVANT non-scam photo (e.g., photo of a tree, road, animal, food, nature, selfie, generic artwork)?
2. If it is IRRELEVANT, describe what it actually shows in plain, friendly language (e.g., "This looks like a photo of a tree, not a scam-related screenshot").
3. If it IS RELEVANT, extract all visible text clearly.

Respond ONLY with this exact JSON format, no markdown, no code blocks:
{
  "isRelevant": true | false,
  "detectedType": "chat_app" | "bank_app" | "call_screen" | "payment_request" | "irrelevant_photo" | "other",
  "description": "<plain language sentence explaining what was detected>",
  "extractedText": "<all text extracted from the screenshot, or empty string if irrelevant>"
}`;

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: imageMime,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const timeToAnalyzeMs = Date.now() - startTime;
    const rawText = response.text?.trim() || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch {
      return res.status(200).json({
        success: true,
        data: {
          isRelevant: true,
          detectedType: "unknown",
          description: "Image analyzed.",
          extractedText: "",
          timeToAnalyzeMs,
        },
        error: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...json,
        timeToAnalyzeMs,
      },
      error: null,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const timeToAnalyzeMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    console.error(`[ANALYZE_IMAGE_ERROR] ${isTimeout ? "Timeout (8s) reached" : "Exception caught"}:`, err.message);

    return res.status(200).json({
      success: true,
      data: {
        isRelevant: true, // Fail open to allow OCR processing if AI fails
        detectedType: "unknown",
        description: isTimeout
          ? "Image visual check timed out — extracted text fallback used."
          : "Image visual check error — extracted text fallback used.",
        extractedText: "",
        degraded: true,
        degradedReason: isTimeout ? "vision_timeout" : "vision_error",
        timeToAnalyzeMs,
      },
      error: null,
    });
  }
}
