import fetch from "node-fetch";

const SAMPLE_SCAM_TRANSCRIPT = 
  "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account.";

async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: SAMPLE_SCAM_TRANSCRIPT })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("Error connecting to server (is it running?):", e.message);
  }
}

run();
