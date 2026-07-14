import fs from "fs";
import path from "path";

const advisoriesPath = path.join(process.cwd(), "data", "advisories.json");
const advisories = JSON.parse(fs.readFileSync(advisoriesPath, "utf-8"));

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { verdict, lang = "en" } = req.query;

  if (!verdict || !advisories[verdict]) {
    return res.status(400).json({ success: false, error: "Invalid or missing verdict" });
  }

  const text = advisories[verdict][lang] || advisories[verdict]["en"];
  return res.status(200).json({ success: true, data: { text, lang }, error: null });
}