import { checkOnDevice } from "../src/lib/onDeviceFilter.js";

const SAMPLE_SCAM_TRANSCRIPT = 
  "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account.";

async function run() {
  console.log("Analyzing transcript locally...");
  const res = await checkOnDevice(SAMPLE_SCAM_TRANSCRIPT);
  console.log("Result:", res);
}

run();
