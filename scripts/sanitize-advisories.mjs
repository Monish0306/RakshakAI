import fs from "fs";
import path from "path";

const advisoriesPath = path.join(process.cwd(), "data", "advisories.json");
const ADVISORIES = JSON.parse(fs.readFileSync(advisoriesPath, "utf-8"));

function fixString(text, targetLang) {
  if (typeof text !== "string") return text;
  
  let output = "";
  // Map offset (Telugu 0C00-0C7F -> Kannada 0C80-0CFF)
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    
    if (targetLang === "kn" && code >= 0x0C00 && code <= 0x0C7F) {
      // Telugu character in Kannada string -> Shift to Kannada
      output += String.fromCharCode(code + 0x80);
    } else if (targetLang === "te" && code >= 0x0C80 && code <= 0x0CFF) {
      // Kannada character in Telugu string -> Shift to Telugu
      output += String.fromCharCode(code - 0x80);
    } else {
      output += char;
    }
  }
  return output;
}

Object.keys(ADVISORIES).forEach(verdict => {
  const translations = ADVISORIES[verdict];
  Object.keys(translations).forEach(lang => {
    translations[lang] = fixString(translations[lang], lang);
  });
});

fs.writeFileSync(advisoriesPath, JSON.stringify(ADVISORIES, null, 2), "utf-8");
console.log("advisories.json successfully sanitized and saved!");
