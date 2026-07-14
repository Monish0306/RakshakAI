import { getLatestMetrics, getAverageLatency } from "../src/lib/metrics.js";

const metrics = await getLatestMetrics();
console.log("Metrics:", metrics);

const avgLatency = await getAverageLatency();
console.log("Average latency (ms):", avgLatency);