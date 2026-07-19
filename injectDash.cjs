const fs = require('fs');

const NEW_KEYS = {
  en: {
    "dash.radarTitle": "Multi-Dimensional Comparison",
    "dash.radarNote": "Privacy and Cost Efficiency scores are illustrative, based on the proportion of checks resolved on-device vs escalated to cloud.",
    "dash.radarRakshak": "Rakshak AI (Hybrid)",
    "dash.radarBaseline": "Naive Keyword Baseline",
    "dash.radarCloud": "Cloud-Only (No Edge Filter)",
    "dash.radarPrecision": "Precision",
    "dash.radarRecall": "Recall",
    "dash.radarSpeed": "Speed",
    "dash.radarPrivacy": "Privacy",
    "dash.radarCost": "Cost Efficiency",
    "dash.trendTitle": "Evaluation History",
    "dash.trendEmpty": "More data points will appear as evaluation runs accumulate.",
    "dash.precautionsTitle": "What To Do If You're Targeted",
    "dash.precautionsLead": "Recovery depends on speed: banks have frozen ₹10,718 crore in fraud cases since 2021, but only ₹323 crore has been refunded — acting within the first hour matters enormously.",
    "dash.precautionsItem1": "Never share OTP/banking details over a call. Hang up and call back on the official number.",
    "dash.precautionsItem2": "\"Digital arrest\" is not how Indian law enforcement operates — no agency arrests you over a video call or demands instant payment.",
    "dash.precautionsItem3": "Report immediately at cybercrime.gov.in or call 1930.",
    "dash.precautionsClosing": "Nearly 45% of reported cyber frauds in India now originate from overseas networks, making speed of reporting even more critical for recovery."
  },
  hi: {
    "dash.radarTitle": "बहुआयामी तुलना",
    "dash.radarNote": "गोपनीयता और लागत दक्षता स्कोर निदर्शी हैं, जो ऑन-डिवाइस बनाम क्लाउड पर हल किए गए चेक के अनुपात पर आधारित हैं।",
    "dash.radarRakshak": "रक्षक AI (हाइब्रिड)",
    "dash.radarBaseline": "साधारण कीवर्ड बेसलाइन",
    "dash.radarCloud": "केवल-क्लाउड (कोई एज फ़िल्टर नहीं)",
    "dash.radarPrecision": "सटीकता",
    "dash.radarRecall": "रीकॉल",
    "dash.radarSpeed": "गति",
    "dash.radarPrivacy": "गोपनीयता",
    "dash.radarCost": "लागत दक्षता",
    "dash.trendTitle": "मूल्यांकन इतिहास",
    "dash.trendEmpty": "जैसे-जैसे मूल्यांकन रन जमा होंगे, अधिक डेटा बिंदु दिखाई देंगे।",
    "dash.precautionsTitle": "यदि आपको लक्षित किया जाता है तो क्या करें",
    "dash.precautionsLead": "वसूली गति पर निर्भर करती है: 2021 से बैंकों ने धोखाधड़ी के मामलों में ₹10,718 करोड़ फ्रीज किए हैं, लेकिन पीड़ितों को केवल ₹323 करोड़ वापस किए गए हैं — पहले घंटे के भीतर कार्रवाई करना बहुत मायने रखता है।",
    "dash.precautionsItem1": "कॉल पर कभी भी OTP/बैंकिंग विवरण साझा न करें। कॉल काटें और आधिकारिक नंबर पर वापस कॉल करें।",
    "dash.precautionsItem2": "\"डिजिटल अरेस्ट\" भारतीय कानून प्रवर्तन का तरीका नहीं है — कोई भी एजेंसी आपको वीडियो कॉल पर गिरफ्तार नहीं करती या तत्काल भुगतान की मांग नहीं करती।",
    "dash.precautionsItem3": "तुरंत cybercrime.gov.in पर रिपोर्ट करें या 1930 पर कॉल करें।",
    "dash.precautionsClosing": "भारत में रिपोर्ट की गई 45% साइबर धोखाधड़ी अब विदेशी नेटवर्क से उत्पन्न होती है, जिससे रिपोर्टिंग की गति और भी महत्वपूर्ण हो जाती है।"
  },
  ta: {
    "dash.radarTitle": "பல பரிமாண ஒப்பீடு",
    "dash.radarNote": "தனியுரிமை மற்றும் செலவு திறன் மதிப்பெண்கள் விளக்கமானவை, சாதனத்தில் தீர்க்கப்பட்டவை மற்றும் கிளவுட்க்கு அனுப்பப்பட்டவை ஆகியவற்றின் விகிதத்தின் அடிப்படையில் அமைந்தவை.",
    "dash.radarRakshak": "ரக்சக் AI (கலப்பினம்)",
    "dash.radarBaseline": "எளிய முக்கியசொல் அடிப்படை",
    "dash.radarCloud": "கிளவுட்-மட்டும் (எட்ஜ் வடிகட்டி இல்லை)",
    "dash.radarPrecision": "துல்லியம்",
    "dash.radarRecall": "மீட்பு",
    "dash.radarSpeed": "வேகம்",
    "dash.radarPrivacy": "தனியுரிமை",
    "dash.radarCost": "செலவு திறன்",
    "dash.trendTitle": "மதிப்பீட்டு வரலாறு",
    "dash.trendEmpty": "மதிப்பீட்டு ஓட்டங்கள் குவியும்போது அதிக தரவு புள்ளிகள் தோன்றும்.",
    "dash.precautionsTitle": "நீங்கள் குறிவைக்கப்பட்டால் என்ன செய்வது",
    "dash.precautionsLead": "மீட்பு வேகத்தைப் பொறுத்தது: 2021 முதல் வங்கிகள் மோசடி வழக்குகளில் ₹10,718 கோடியை முடக்கியுள்ளன, ஆனால் ₹323 கோடி மட்டுமே திருப்பி அளிக்கப்பட்டது — முதல் ஒரு மணி நேரத்திற்குள் செயல்படுவது மிகவும் முக்கியம்.",
    "dash.precautionsItem1": "அழைப்பில் OTP/வங்கி விவரங்களை ஒருபோதும் பகிர வேண்டாம். அழைப்பைத் துண்டித்து அதிகாரப்பூர்வ எண்ணுக்கு மீண்டும் அழைக்கவும்.",
    "dash.precautionsItem2": "\"டிஜிட்டல் கைது\" என்பது இந்திய சட்ட அமலாக்கம் செயல்படும் விதம் அல்ல — எந்தவொரு நிறுவனமும் உங்களை வீடியோ அழைப்பில் கைது செய்யாது அல்லது உடனடி கட்டணம் கோராது.",
    "dash.precautionsItem3": "உடனடியாக cybercrime.gov.in இல் புகாரளிக்கவும் அல்லது 1930 ஐ அழைக்கவும்.",
    "dash.precautionsClosing": "இந்தியாவில் பதிவாகும் இணைய மோசடிகளில் கிட்டத்தட்ட 45% வெளிநாட்டு நெட்வொர்க்குகளிலிருந்து உருவாகின்றன, இது புகாரளிக்கும் வேகத்தை மேலும் முக்கியமானதாக்குகிறது."
  },
  kn: {
    "dash.radarTitle": "ಬಹು ಆಯಾಮದ ಹೋಲಿಕೆ",
    "dash.radarNote": "ಗೌಪ್ಯತೆ ಮತ್ತು ವೆಚ್ಚ ದಕ್ಷತೆಯ ಅಂಕಗಳು ವಿವರಣಾತ್ಮಕವಾಗಿವೆ, ಸಾಧನದಲ್ಲಿ ಪರಿಹರಿಸಲಾದ ವಿರುದ್ಧ ಕ್ಲೌಡ್‌ಗೆ ಕಳುಹಿಸಲಾದ ಚೆಕ್‌ಗಳ ಅನುಪಾತವನ್ನು ಆಧರಿಸಿವೆ.",
    "dash.radarRakshak": "ರಕ್ಷಕ್ AI (ಹೈಬ್ರಿಡ್)",
    "dash.radarBaseline": "ಸಾಮಾನ್ಯ ಕೀವರ್ಡ್ ಬೇಸ್‌ಲೈನ್",
    "dash.radarCloud": "ಕ್ಲೌಡ್-ಮಾತ್ರ (ಎಡ್ಜ್ ಫಿಲ್ಟರ್ ಇಲ್ಲ)",
    "dash.radarPrecision": "ನಿಖರತೆ",
    "dash.radarRecall": "ಮರುಪಡೆಯುವಿಕೆ",
    "dash.radarSpeed": "ವೇಗ",
    "dash.radarPrivacy": "ಗೌಪ್ಯತೆ",
    "dash.radarCost": "ವೆಚ್ಚ ದಕ್ಷತೆ",
    "dash.trendTitle": "ಮೌಲ್ಯಮಾಪನ ಇತಿಹಾಸ",
    "dash.trendEmpty": "ಮೌಲ್ಯಮಾಪನ ರನ್‌ಗಳು ಸಂಗ್ರಹವಾದಂತೆ ಹೆಚ್ಚಿನ ಡೇಟಾ ಪಾಯಿಂಟ್‌ಗಳು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.",
    "dash.precautionsTitle": "ನಿಮ್ಮನ್ನು ಗುರಿಯಾಗಿಸಿದರೆ ಏನು ಮಾಡಬೇಕು",
    "dash.precautionsLead": "ಚೇತರಿಕೆ ವೇಗವನ್ನು ಅವಲಂಬಿಸಿರುತ್ತದೆ: 2021 ರಿಂದ ಬ್ಯಾಂಕುಗಳು ವಂಚನೆ ಪ್ರಕರಣಗಳಲ್ಲಿ ₹10,718 ಕೋಟಿಗಳನ್ನು ಸ್ಥಗಿತಗೊಳಿಸಿವೆ, ಆದರೆ ಕೇವಲ ₹323 ಕೋಟಿಗಳನ್ನು ಮರುಪಾವತಿಸಲಾಗಿದೆ — ಮೊದಲ ಗಂಟೆಯೊಳಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುವುದು ಬಹಳ ಮುಖ್ಯ.",
    "dash.precautionsItem1": "ಕರೆಯಲ್ಲಿ OTP/ಬ್ಯಾಂಕಿಂಗ್ ವಿವರಗಳನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಕರೆ ಕಡಿತಗೊಳಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಸಂಖ್ಯೆಗೆ ಮರಳಿ ಕರೆ ಮಾಡಿ.",
    "dash.precautionsItem2": "\"ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್\" ಭಾರತೀಯ ಕಾನೂನು ಜಾರಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ರೀತಿಯಲ್ಲ — ಯಾವುದೇ ಏಜೆನ್ಸಿಯು ನಿಮ್ಮನ್ನು ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಬಂಧಿಸುವುದಿಲ್ಲ ಅಥವಾ ತ್ವರಿತ ಪಾವತಿಗೆ ಬೇಡಿಕೆಯಿಡುವುದಿಲ್ಲ.",
    "dash.precautionsItem3": "ತಕ್ಷಣ cybercrime.gov.in ನಲ್ಲಿ ವರದಿ ಮಾಡಿ ಅಥವಾ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
    "dash.precautionsClosing": "ಭಾರತದಲ್ಲಿ ವರದಿಯಾದ ಸೈಬರ್ ವಂಚನೆಗಳಲ್ಲಿ ಸುಮಾರು 45% ವಿದೇಶಿ ನೆಟ್‌ವರ್ಕ್‌ಗಳಿಂದ ಹುಟ್ಟಿಕೊಂಡಿವೆ, ಇದು ವರದಿ ಮಾಡುವ ವೇಗವನ್ನು ಇನ್ನಷ್ಟು ನಿರ್ಣಾಯಕಗೊಳಿಸುತ್ತದೆ."
  },
  te: {
    "dash.radarTitle": "బహుళ-దశల పోలిక",
    "dash.radarNote": "గోప్యత మరియు ఖర్చు సామర్థ్యం స్కోర్‌లు ఉదాహరణార్థకం, ఆన్-డివైస్ వర్సెస్ క్లౌడ్‌కి పంపబడిన చెక్‌ల నిష్పత్తి ఆధారంగా ఉంటాయి.",
    "dash.radarRakshak": "రక్షక్ AI (హైబ్రిడ్)",
    "dash.radarBaseline": "సాధారణ కీవర్డ్ బేస్‌లైన్",
    "dash.radarCloud": "క్లౌడ్-మాత్రమే (ఎడ్జ్ ఫిల్టర్ లేదు)",
    "dash.radarPrecision": "ఖచ్చితత్వం",
    "dash.radarRecall": "రీకాల్",
    "dash.radarSpeed": "వేగం",
    "dash.radarPrivacy": "గోప్యత",
    "dash.radarCost": "ఖర్చు సామర్థ్యం",
    "dash.trendTitle": "మూల్యాంకన చరిత్ర",
    "dash.trendEmpty": "మూల్యాంకన పరుగులు పేరుకుపోతున్న కొద్దీ మరిన్ని డేటా పాయింట్లు కనిపిస్తాయి.",
    "dash.precautionsTitle": "మిమ్మల్ని లక్ష్యంగా చేసుకుంటే ఏమి చేయాలి",
    "dash.precautionsLead": "రికవరీ వేగంపై ఆధారపడి ఉంటుంది: 2021 నుండి బ్యాంకులు మోసం కేసుల్లో ₹10,718 కోట్లను ఫ్రీజ్ చేశాయి, అయితే కేవలం ₹323 కోట్లు మాత్రమే తిరిగి ఇవ్వబడ్డాయి — మొదటి గంటలో వ్యవహరించడం చాలా ముఖ్యం.",
    "dash.precautionsItem1": "కాల్‌లో OTP/బ్యాంకింగ్ వివరాలను ఎప్పుడూ పంచుకోవద్దు. కాల్ కట్ చేసి అధికారిక నంబర్‌కు తిరిగి కాల్ చేయండి.",
    "dash.precautionsItem2": "\"డిజిటల్ అరెస్ట్\" అనేది భారతీయ చట్ట అమలు సంస్థలు పనిచేసే విధానం కాదు — ఏజెన్సీ మిమ్మల్ని వీడియో కాల్‌లో అరెస్టు చేయదు లేదా తక్షణ చెల్లింపును డిమాండ్ చేయదు.",
    "dash.precautionsItem3": "వెంటనే cybercrime.gov.in లో నివేదించండి లేదా 1930 కి కాల్ చేయండి.",
    "dash.precautionsClosing": "భారతదేశంలో నివేదించబడిన సైబర్ మోసాలలో దాదాపు 45% ఇప్పుడు విదేశీ నెట్‌వర్క్‌ల నుండి పుట్టుకొస్తున్నాయి, నివేదించే వేగం మరింత కీలకం."
  }
};

let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

for (const lang of Object.keys(NEW_KEYS)) {
  const marker = lang + ": {";
  const splitPos = content.indexOf(marker) + marker.length;
  
  if (splitPos > marker.length - 1) {
    let injection = '\n';
    for (const [k, v] of Object.entries(NEW_KEYS[lang])) {
      // properly escape quotes in v
      const escapedV = v.replace(/"/g, '\\"');
      injection += "    \"" + k + "\": \"" + escapedV + "\",\n";
    }
    content = content.slice(0, splitPos) + injection + content.slice(splitPos);
  }
}

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('Injected safely.');
