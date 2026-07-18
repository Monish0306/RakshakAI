const KANNADA_STRINGS = {
  highRiskAdvisory: "ಈ ಕರೆಯಲ್ಲಿ ವಂಚನೆಯ ಬಲವಾದ ಸೂಚನೆಗಳಿವೆ. ನಿಮ್ಮ OTP, ಬ್ಯಾಂಕ್ ವಿವರಗಳು ಅಥವಾ ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಯಾವುದೇ ಪಾವತಿ ಮಾಡಬೇಡಿ. ಈಗಲೇ ಕರೆಯನ್ನು ಕಡಿತಗೊಳಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಸಂಖ್ಯೆಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ — ಈ ಕರೆಯಲ್ಲಿ ನೀಡಲಾದ ಸಂಖ್ಯೆಗೆ ಅಲ್ಲ.",
  uncertainAdvisory: "ಈ ಕರೆಯಲ್ಲಿ ಕೆಲವು ಸಂಶಯಾಸ್ಪದ ಸೂಚನೆಗಳಿವೆ. ಜಾಗರೂಕರಾಗಿರಿ — ನಿಮ್ಮ OTP ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಸಂಶಯವಿದ್ದರೆ, ಕರೆಯನ್ನು ಕಡಿತಗೊಳಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಸಂಖ್ಯೆಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ.",
  safeAdvisory: "ಈ ಕರೆಯಲ್ಲಿ ತಿಳಿದಿರುವ ವಂಚನೆಯ ಮಾದರಿಯ ಸೂಚನೆಗಳಿಲ್ಲ. ಸಾಮಾನ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆಯಾಗಿ, ನಿಮ್ಮ OTP ಅನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ, ಮತ್ತು ಅಸಾಮಾನ್ಯ ವಿನಂತಿಗಳನ್ನು ಯಾವಾಗಲೂ ಅಧಿಕೃತ ಮಾರ್ಗಗಳ ಮೂಲಕ ಪರಿಶೀಲಿಸಿ.",
  helplineTitle: "ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಹೆಲ್ಪ್‌ಲೈನ್",
  helplineDesc: "24/7 ಲಭ್ಯವಿದೆ. ನೀವು ಬ್ಯಾಂಕಿಂಗ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದರೆ ತಕ್ಷಣ ಕರೆ ಮಾಡಿ.",
  takeMoment: "ಒಂದು ಕ್ಷಣ ತಾಳಿ.",
  dontPanic: "ಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ನಿರ್ಧರಿಸುವ ಮುನ್ನ ಮೇಲಿನ ಕಾರಣಗಳನ್ನು ಓದಿ. ಗಾಬರಿಯಾಗಬೇಡಿ.",
  checkedPrivately: "ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಖಾಸಗಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
  checkedOnDevice: "ಸಾಧನದಲ್ಲೇ ಪರಿಶೀಲಿಸಲಾಗಿದೆ — ಯಾವುದೇ ಸರ್ವರ್‌ಗೆ ಏನನ್ನೂ ಕಳುಹಿಸಲಾಗಿಲ್ಲ",
  verifiedCloud: "ಸುರಕ್ಷಿತ ಕ್ಲೌಡ್ ತಾರ್ಕಿಕತೆಯ ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗಿದೆ"
};

function verifyAndFix(str, key) {
  let output = "";
  let issues = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    // Telugu range is 0C00 - 0C7F
    // Kannada range is 0C80 - 0CFF
    if (code >= 0x0C00 && code <= 0x0C7F) {
      // Map Telugu sign to Kannada sign equivalent
      // Telugu U sign is 0C41 -> Kannada U sign is 0CC1 (difference of +0x80)
      // Telugu Ai sign is 0C48 -> Kannada Ai sign is 0CC8
      // Telugu E sign is 0C46 -> Kannada E sign is 0CC6
      const mappedCode = code + 0x80;
      const correctedChar = String.fromCharCode(mappedCode);
      issues.push(`Index ${i}: ${char} (U+0${code.toString(16).toUpperCase()}) -> Mapped to ${correctedChar} (U+0${mappedCode.toString(16).toUpperCase()})`);
      output += correctedChar;
    } else {
      output += char;
    }
  }
  return { output, issues };
}

Object.keys(KANNADA_STRINGS).forEach(key => {
  const { output, issues } = verifyAndFix(KANNADA_STRINGS[key], key);
  console.log(`\nKey: ${key}`);
  if (issues.length > 0) {
    console.log(`  Issues found and fixed:\n    ${issues.join("\n    ")}`);
    console.log(`  Original: "${KANNADA_STRINGS[key]}"`);
    console.log(`  Fixed:    "${output}"`);
  } else {
    console.log(`  Clean! All characters are pure Kannada.`);
  }
});
