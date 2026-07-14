import { useState } from "react";
import { classifyTranscript, getAdvisory } from "../lib/api";
import type { ClassificationResponse } from "../lib/api";
// @ts-ignore: Implicit any for JS module without types
import { checkOnDevice } from "../lib/onDeviceFilter";

export function useClassifier() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResponse["data"] | null>(null);
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runClassification(transcript: string, lang: string = "en") {
    setLoading(true);
    setError(null);
    setResult(null);
    setAdvisory(null);

    try {
      const localCheck = await checkOnDevice(transcript);

      if (!localCheck.escalate) {
        console.log("[AUDIT] Resolving on-device, cloud API skipped");
        // Resolved entirely on-device — never sent to any server
        const safeResult: ClassificationResponse["data"] = {
          verdict: "SAFE",
          confidence: 90,
          matches: [],
          explanation:
            "This does not resemble known scam patterns. Checked entirely on your device — no data was sent to any server.",
          ranOnDevice: true,
          timeToVerdictMs: 0,
          redFlagsDetected: []
        };
        setResult(safeResult);

        const advisoryRes = await getAdvisory(safeResult.verdict, lang);
        setAdvisory(advisoryRes.data.text);
        return;
      }

      console.log("[AUDIT] Escalating to cloud API");
      // Only escalates to the cloud when the on-device filter flags it as suspicious
      const classifyRes = await classifyTranscript(transcript);
      setResult({ ...classifyRes.data, ranOnDevice: false });

      const advisoryRes = await getAdvisory(classifyRes.data.verdict, lang);
      setAdvisory(advisoryRes.data.text);
    } catch (err: any) {
      console.error("Classification error:", err);
      setError(err.message || "An error occurred while communicating with the server.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, advisory, error, runClassification };
}