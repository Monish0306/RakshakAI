import { pipeline, cos_sim, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;

const T1 = "This is Officer Sharma from CBI. Transfer money immediately or a warrant will be issued.";
const T2 = "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account.";
const BENIGN = "Hello, this is your bank calling to confirm a recent transaction of 500 rupees. If this was you, no action needed.";

async function run() {
  const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  const o1 = await model(T1, { pooling: "mean", normalize: true });
  const o2 = await model(T2, { pooling: "mean", normalize: true });
  const o3 = await model(BENIGN, { pooling: "mean", normalize: true });

  const simT1_T2 = cos_sim(o1.data, o2.data);
  const simT1_BENIGN = cos_sim(o1.data, o3.data);
  const simT2_BENIGN = cos_sim(o2.data, o3.data);

  console.log(`Similarity T1 <-> T2: ${simT1_T2}`);
  console.log(`Similarity T1 <-> Benign: ${simT1_BENIGN}`);
  console.log(`Similarity T2 <-> Benign: ${simT2_BENIGN}`);
}

run();
