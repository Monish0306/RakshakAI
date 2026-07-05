import {onRequest} from "firebase-functions/https";

export const healthCheck = onRequest((req, res) => {
  res.json({status: "ok"});
});