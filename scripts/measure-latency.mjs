const API_BASE = "https://rakshak-ai-ten.vercel.app";

const sampleTranscripts = [
  "This is Officer Sharma from CBI. Transfer money immediately or a warrant will be issued.",
  "Hello, this is your bank confirming a transaction of 500 rupees. No action needed if this was you.",
  "Congratulations! You have won a free vacation package. Share your card details to claim it.",
  "This is Blue Dart courier, please confirm your address for delivery today.",
  "Sir this is ED officer, you are under digital arrest, do not disconnect the video call.",
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const timings = [];
  for (let i = 0; i < 15; i++) {
    const transcript = sampleTranscripts[i % sampleTranscripts.length];
    const start = Date.now();
    const res = await fetch(`${API_BASE}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const json = await res.json();
    const elapsed = Date.now() - start;
    timings.push(elapsed);
    console.log(`[${i + 1}/15] ${json.data.verdict} — ${elapsed}ms`);
    await sleep(4500);
  }
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
  console.log(`\nAverage latency: ${avg.toFixed(0)}ms`);
  return avg;
}

run();