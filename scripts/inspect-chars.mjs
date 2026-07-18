const bad1 = "ಕ್ರೈಮ್";
const good1 = "ಕ್ರೈಮ್";

const bad2 = "ಕಳುಹಿಸಲಾಗಿಲ್ಲ";
const good2 = "ಕಳುಹಿಸಲಾಗಿಲ್ಲ";

const bad3 = "ಸುರಕ್ಷಿತ"; // Let's check if the bad one had U+0C41
const good3 = "ಸುರಕ್ಷಿತ";

function inspect(str) {
  return str.split("").map(c => `[${c} (U+0${c.charCodeAt(0).toString(16).toUpperCase()})]`).join(" ");
}

console.log("Good 1 (क्राइम):", inspect(good1));
console.log("Good 2 (ಕಳುಹಿಸಲಾಗಿಲ್ಲ):", inspect(good2));
console.log("Good 3 (ಸುರಕ್ಷಿತ):", inspect(good3));
