const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

// --- المعلومات ديالك (عمر هادشي) ---
const VERIFY_TOKEN = "maroc_bot_2024";
const WHATSAPP_TOKEN = "EAARpeqfyTZAgBRFPYIR3dXVGsEkMDXPZAYfxerdhKqjc2Yq0NCNuZBdoAKzbOZA8yXLjSWmZBF7a6APHKFhVN4b0dIr99BRjIcDokYTzeBbSIx0wiZADjYMFi4949Fbp2Sb7pucvugQzk7ocnisg1udYtzZA5PkUnZCqZC0nTDkLYGIgdcXOm0HhBrothJmFBxIZAwjhXqYX4zwgzFFZBzcer9KaRcb8k4CyZCivwYZAEthfplmWCNlaCFxSJ0juFh7YYzQ96hQZBsbmW7ZBhD9OmrCvT8PnsZCY";
const PHONE_NUMBER_ID = "1021334914401055";
const GEMINI_API_KEY = "AIzaSyBWzUiqUc_CDtSviHcJZJf4jfupHde81I4";
// ---------------------------------

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from;
      const userText = msg.text.body;

      console.log("ميساج من الكليان: " + userText);

      try {
        // 1. صيفط السؤال لـ Gemini
        const geminiResponse = await axios({
          method: "POST",
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          data: {
            contents: [{
              parts: [{ text: `أنت مساعد ذكي لشركة SYN للخدمات الرقمية (فيديو إيديتينغ وكوبي رايتينغ). جاوب الكليان بالدارجة المغربية وبطريقة احترافية. السؤال هو: ${userText}` }]
            }]
          }
        });

        const aiReply = geminiResponse.data.candidates[0].content.parts[0].text;

        // 2. صيفط الجواب لواتساب
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: aiReply }
          },
          headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}` }
        });

      } catch (err) {
        console.log("خطأ: " + err.message);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('AI Bot is ready!'));
