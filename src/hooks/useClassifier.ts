import { useState } from "react";
import { classifyTranscript, getAdvisory, matchCampaign, recordTelemetry } from "../lib/api";
import type { ClassificationResponse } from "../lib/api";
// @ts-ignore: Implicit any for JS module without types
import { checkOnDevice } from "../lib/onDeviceFilter";
import { TRANSLATIONS } from "../lib/translations";

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

    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    try {
      const localCheck = await checkOnDevice(transcript);

      // Handle local instant resolution (INSTANT_HIGH_RISK, SHALLOW_SAFE, DEEP_SAFE)
      if (!localCheck.escalate) {
        console.log(`[AUDIT] Instant on-device resolution (bucket: ${localCheck.bucket})`);
        recordTelemetry("on-device");

        const initialVerdict: "HIGH_RISK" | "SAFE" = localCheck.bucket === "INSTANT_HIGH_RISK" ? "HIGH_RISK" : "SAFE";
        const initialExplanation = initialVerdict === "HIGH_RISK"
          ? (t["shield.instantHighRiskExplanation"] || "High-risk scam indicators detected on-device. Treat this call with extreme caution.")
          : t["shield.safeExplanation"];

        const initialCategory = "Category pending AI verification...";
        const initialReasoning = initialVerdict === "HIGH_RISK"
          ? "High-risk scam indicators detected on-device. Running full AI taxonomy classification in background..."
          : "No scam indicators detected on-device. Verifying with background AI check...";

        const instantResult: ClassificationResponse["data"] = {
          verdict: initialVerdict,
          confidence: initialVerdict === "HIGH_RISK" ? 95 : 90,
          category: initialCategory,
          reasoning: initialReasoning,
          matches: localCheck.redFlagsDetected.map((term: string) => ({
            indicatorType: 1,
            evidence: term,
            reason: `Detected known red flag term: "${term}"`,
            severity: "High" as const,
            riskScore: 75
          })),
          explanation: initialExplanation,
          ranOnDevice: true,
          verificationStatus: localCheck.needsAsyncCheck ? "quick_check" : "ai_verified",
          timeToVerdictMs: 0,
          redFlagsDetected: localCheck.redFlagsDetected || []
        };

        setResult(instantResult);
        setLoading(false); // UI instantly shows result!

        const advisoryRes = await getAdvisory(instantResult.verdict, lang);
        setAdvisory(advisoryRes.data.text);

        // If background verification safety net is required, fire async check non-blockingly
        if (localCheck.needsAsyncCheck) {
          console.log("[AUDIT] Launching non-blocking background LLM safety net check...");
          classifyTranscript(transcript, lang).then(async (classifyRes) => {
            if (classifyRes.success && classifyRes.data) {
              const bgData = classifyRes.data;
              const isDegraded = bgData.degraded;

              setResult(prev => {
                if (!prev) return prev;
                // If background check returned a degraded response (timeout), keep quick check with degraded flag
                if (isDegraded) {
                  return {
                    ...prev,
                    degraded: true,
                    degradedReason: bgData.degradedReason,
                    verificationStatus: "degraded"
                  };
                }
                // Seamless upgrade with AI verification confirmation & detailed taxonomy matches
                return {
                  ...bgData,
                  ranOnDevice: true,
                  verificationStatus: "ai_verified",
                  matches: bgData.matches && bgData.matches.length > 0 ? bgData.matches : prev.matches,
                  explanation: bgData.explanation || prev.explanation,
                  verdict: bgData.verdict || prev.verdict,
                };
              });

              // Refresh advisory if verdict upgraded
              if (bgData.verdict && bgData.verdict !== initialVerdict) {
                const updatedAdvisory = await getAdvisory(bgData.verdict, lang);
                setAdvisory(updatedAdvisory.data.text);
              }
            }
          }).catch(e => console.warn("Background LLM verification warning:", e));
        }

        return;
      }

      console.log("[AUDIT] Escalating to cloud API (Ambiguous range)");
      recordTelemetry("cloud");
      
      const classifyRes = await classifyTranscript(transcript, lang);
      let finalResult: ClassificationResponse["data"] = {
        ...classifyRes.data,
        ranOnDevice: false,
        verificationStatus: classifyRes.data.degraded ? "degraded" : "ai_verified"
      };

      if (finalResult.verdict === "HIGH_RISK" && localCheck.transcriptEmbedding) {
        try {
          console.log("[AUDIT] Running secure server-side campaign match");
          const sessionDataPayload = { ...finalResult, transcript };
          const matchRes = await matchCampaign(localCheck.transcriptEmbedding, sessionDataPayload, "");
          if (matchRes.success && matchRes.data) {
            finalResult.matchCount = matchRes.data.matchCount;
            finalResult.campaignId = matchRes.data.campaignId;
          }
        } catch (e) {
          console.error("Campaign match failed:", e);
        }
      }

      setResult(finalResult);

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