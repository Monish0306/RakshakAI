const testTranscripts = [
  "Contact me at +91-9876543210 or 09876543210 or 98765 43210 immediately.",
  "Send money to payment@okaxis or scammer.upi@ybl or user@gmail.com.",
  "Transfer money to Bank Account number 12003400560078 or SBI 998877665544.",
  "Your Device ID: A1B2C3D4E5F6 and your IMEI: 861234030012345 is blocked."
];

// Phone regex: matches standard Indian formats, allows space/hyphen
const phoneRegex = /(?:\+?91|0)?[-\s]?[6-9]\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/g;

// UPI regex: matches alphanumeric followed by @ bank/upi domains, excluding common emails
const upiRegex = /[a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook|icloud|aol|mail|proton)[a-zA-Z0-9.-]+\b/gi;

// Bank account regex: 9 to 18 digits
const bankRegex = /\b\d{9,18}\b/g;

// Device/IMEI regex: extracts Device ID or IMEI
const deviceRegex = /(?:Device\s*(?:ID)?|IMEI)[:\s]+([A-Z0-9]{8,16})/gi;

testTranscripts.forEach((t, i) => {
  console.log(`\n--- Test ${i + 1} ---`);
  console.log(`Text: "${t}"`);
  
  const phones = t.match(phoneRegex) || [];
  console.log(`Phones matched:`, phones);
  
  const upis = t.match(upiRegex) || [];
  console.log(`UPIs matched:`, upis);
  
  const banks = t.match(bankRegex) || [];
  // Filter out phone numbers from bank matches if they overlap
  const filteredBanks = banks.filter(b => {
    // If it's 10 digits and starts with 6-9, it's likely a phone number, unless it is part of a longer account
    if (b.length === 10 && /^[6-9]/.test(b)) {
      return false; // skip
    }
    return true;
  });
  console.log(`Banks matched (raw):`, banks);
  console.log(`Banks matched (filtered):`, filteredBanks);
  
  const devices = [];
  let devMatch;
  while ((devMatch = deviceRegex.exec(t)) !== null) {
    devices.push(devMatch[1]);
  }
  console.log(`Devices matched:`, devices);
});
