const API_BASE = "https://rakshak-ai-ten.vercel.app";

const edgeCases = [
  "यह सीबीआई अधिकारी शर्मा बोल रहा हूँ। आप डिजिटल गिरफ्तारी में हैं। तुरंत पैसे ट्रांसफर करें।", // Hindi
  "இது சிபிஐ அதிகாரி பேசுகிறேன். நீங்கள் டிஜிட்டல் கைது செய்யப்பட்டுள்ளீர்கள்.", // Tamil
  "helo sir dis is cbi officr u r under arest pls trnsfr money now urgent", // noisy/typo'd English
  "sir maine suna hai ki aap ka case cbi mein chal raha hai turant baat karo warna arrest ho jayega", // Hinglish
];

async function run() {
  for (const transcript of edgeCases) {
    const res = await fetch(`${API_BASE}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const json = await res.json();
    console.log(`${json.data.verdict} (conf: ${json.data.confidence}) — "${transcript.slice(0, 40)}..."`);
    await new Promise(r => setTimeout(r, 2000));
  }
}
run();