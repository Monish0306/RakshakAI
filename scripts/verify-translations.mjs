import { TRANSLATIONS } from "../src/lib/translations.ts";
import fs from "fs";
import path from "path";

const advisoriesPath = path.join(process.cwd(), "data", "advisories.json");
const ADVISORIES = JSON.parse(fs.readFileSync(advisoriesPath, "utf-8"));

// Codepoint range maps
const RANGES = {
  hi: { min: 0x0900, max: 0x097F, name: "Devanagari (Hindi)" },
  ta: { min: 0x0B80, max: 0x0BFF, name: "Tamil" },
  kn: { min: 0x0C80, max: 0x0CFF, name: "Kannada" },
  te: { min: 0x0C00, max: 0x0C7F, name: "Telugu" }
};

let errorsFound = 0;

function checkText(text, lang, pathName) {
  if (typeof text !== "string") return;
  
  // ASCII (0-127), punctuation, currency symbols, emojis, and basic formatting are allowed
  // We only inspect characters that fall inside the Indian scripts Unicode block: U+0900 to U+0DFF
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    
    // Check if character is in the Indic range
    if (code >= 0x0900 && code <= 0x0DFF) {
      const currentRange = RANGES[lang];
      if (currentRange) {
        if (code < currentRange.min || code > currentRange.max) {
          // Find if it belongs to another language's range
          let foreignLang = "Unknown Indic Script";
          Object.keys(RANGES).forEach(l => {
            if (code >= RANGES[l].min && code <= RANGES[l].max) {
              foreignLang = RANGES[l].name;
            }
          });
          
          console.error(`[ERROR] Cross-script contamination in ${pathName} (${lang}):`);
          console.error(`  Found character '${char}' (U+0${code.toString(16).toUpperCase()}) belonging to ${foreignLang}.`);
          console.error(`  Context: "...${text.slice(Math.max(0, i - 10), Math.min(text.length, i + 10))}..."`);
          errorsFound++;
        }
      }
    }
  }
}

console.log("=== STARTING TRANSLATION LOCALIZATION VERIFICATION ===");

// 1. Check translations.ts
Object.keys(TRANSLATIONS).forEach(lang => {
  if (lang === "en") return; // Skip English check for script validation
  const strings = TRANSLATIONS[lang];
  Object.keys(strings).forEach(key => {
    checkText(strings[key], lang, `translations.ts [key: ${key}]`);
  });
});

// 2. Check advisories.json
Object.keys(ADVISORIES).forEach(verdict => {
  const translations = ADVISORIES[verdict];
  Object.keys(translations).forEach(lang => {
    if (lang === "en") return;
    checkText(translations[lang], lang, `advisories.json [verdict: ${verdict}]`);
  });
});

console.log("\n==================================================");
if (errorsFound === 0) {
  console.log("SUCCESS: All localized translation sets verified clean!");
  console.log("Zero cross-script contamination detected.");
  process.exit(0);
} else {
  console.error(`FAILED: Found ${errorsFound} cross-script errors.`);
  process.exit(1);
}
