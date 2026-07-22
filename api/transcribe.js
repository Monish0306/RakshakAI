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

  const { audio, mimeType, language } = req.body;
  if (!audio || typeof audio !== "string") {
    return res.status(400).json({ success: false, error: "Missing base64 audio data" });
  }

  // Double check payload size (Vercel payload limit is 4.5MB, so base64 string shouldn't exceed ~5.5MB)
  if (audio.length > 5.5 * 1024 * 1024) {
    return res.status(413).json({ success: false, error: "Payload size too large" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "Transcription API key missing on server"
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = audio.replace(/^data:audio\/\w+;base64,/, "");
  
  // Normalize browser mime types if necessary
  let audioMime = mimeType || "audio/mp3";
  if (audioMime.includes("audio/x-m4a")) {
    audioMime = "audio/m4a";
  } else if (audioMime.includes("audio/mp4")) {
    // Gemini supports mp4 audio under audio/mp4 or audio/m4a
    audioMime = "audio/mp4";
  }

  const targetLang = language || "en";
  const prompt = `You are an expert audio transcription assistant for a citizen cyber-safety application.
Analyze the attached audio recording.
Your task is to transcribe the spoken audio word-for-word as accurately as possible.
Instructions:
1. Detect the spoken language (which may be English, Hindi, Tamil, Kannada, or Telugu).
2. Transcribe the text in the script of the language spoken:
   - If Hindi, write in Devanagari script (e.g. सीबीआई, डिजिटल अरेस्ट, पुलिस).
   - If Tamil, write in Tamil script.
   - If Telugu, write in Telugu script.
   - If Kannada, write in Kannada script.
   - If English, write in standard English.
3. Transcribe only what is actually spoken in the recording. Do NOT translate the words to another language.
4. Output ONLY the plain transcription text. Do NOT include any code blocks, markdown wrapper tags, metadata, speaker labels (such as "Speaker A:"), or extra commentary.
5. If the audio is silent or contains only static, return an empty string.`;

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for audio transcribing

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
                mimeType: audioMime,
              },
            },
          ],
        },
      ],
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const timeToTranscribeMs = Date.now() - startTime;
    const transcriptText = response.text?.trim() || "";

    return res.status(200).json({
      success: true,
      transcript: transcriptText,
      timeToTranscribeMs
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const timeToTranscribeMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    console.error(`[TRANSCRIBE_ERROR] ${isTimeout ? "Timeout (15s) reached" : "Exception caught"}:`, err.message);

    return res.status(500).json({
      success: false,
      error: isTimeout ? "Audio transcription timed out." : "Transcription failed: " + err.message,
      timeToTranscribeMs
    });
  }
}
