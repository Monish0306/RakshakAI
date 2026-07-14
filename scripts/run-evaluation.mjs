import fs from "fs";

const API_BASE = "https://rakshak-ai-ten.vercel.app";
const evalSet = JSON.parse(fs.readFileSync("./data/evaluation-set.json", "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map your dataset's 3-way labels to the classifier's 3-way verdicts
function labelsMatch(trueLabel, verdict) {
  const map = { scam: "HIGH_RISK", uncertain: "UNCERTAIN", legitimate: "SAFE" };
  return map[trueLabel] === verdict;
}

async function classifyWithRetry(transcript, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${API_BASE}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (res.status === 429) {
      const waitTime = 10000 * (attempt + 1);
      console.log(`  Rate limited, waiting ${waitTime / 1000}s before retry ${attempt + 1}...`);
      await sleep(waitTime);
      continue;
    }

    const json = await res.json();
    if (!json.success) {
      return { verdict: null, confidence: null, degraded: false, error: json.error };
    }
    return {
      verdict: json.data.verdict,
      confidence: json.data.confidence,
      degraded: !!json.data.degraded,
      error: null,
    };
  }
  return { verdict: null, confidence: null, degraded: false, error: "Rate limited after all retries" };
}

async function runEvaluation() {
  let truePositives = 0, falsePositives = 0, falseNegatives = 0, trueNegatives = 0;
  let errors = 0;
  const results = [];

  for (let i = 0; i < evalSet.length; i++) {
    const { transcript, label } = evalSet[i];
    const { verdict, confidence, degraded, error } = await classifyWithRetry(transcript);

    if (error || !verdict) {
      errors++;
      results.push({ transcript: transcript.slice(0, 80), label, verdict: null, confidence: null, degraded, error });
      console.log(`[${i + 1}/${evalSet.length}] label=${label} ERROR: ${error}`);
    } else {
      const isCorrect = labelsMatch(label, verdict);
      const predictedScam = verdict === "HIGH_RISK";
      const actualScam = label === "scam";
      if (predictedScam && actualScam) truePositives++;
      else if (predictedScam && !actualScam) falsePositives++;
      else if (!predictedScam && actualScam) falseNegatives++;
      else trueNegatives++;

      results.push({ transcript: transcript.slice(0, 80), label, verdict, confidence, degraded, isCorrect });
      console.log(`[${i + 1}/${evalSet.length}] label=${label} verdict=${verdict} conf=${confidence}${degraded ? " (degraded)" : ""} ${isCorrect ? "✅" : "❌"}`);
    }

    await sleep(7000); // ~13 requests/minute — safely under the 15 RPM free-tier limit
  }

  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const degradedCount = results.filter(r => r.degraded).length;

  console.log("\n=== FINAL RESULTS ===");
  console.log({ precision, recall, truePositives, falsePositives, falseNegatives, trueNegatives, errors });
  console.log(`\nDegraded (fallback) responses: ${degradedCount}/${evalSet.length}`);

  fs.writeFileSync("./data/evaluation-results.json", JSON.stringify({
    computedAt: new Date().toISOString(),
    totalCases: evalSet.length,
    precision, recall, truePositives, falsePositives, falseNegatives, trueNegatives, errors, degradedCount,
    results,
  }, null, 2));
}

runEvaluation();