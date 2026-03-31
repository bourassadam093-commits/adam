const express = require('express');
const axios = require('axios'); // ضروري باش نصيفطو الرد
const app = express().use(express.json());

const VERIFY_TOKEN = "maroc_bot_2024";
const ACCESS_TOKEN = "YOUR_TOKEN"; // حط الرمز هنا
const PHONE_NUMBER_ID = "YOUR_PHONE_ID"; // حط المعرف هنا

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
      const from = msg.from; // رقم المرسل
      const text = msg.text.body.toLowerCase(); // نص الرسالة

      console.log("وصل ميساج: " + text);

      let reply = "مرحباً بك! أنا بوت شركة SYN، كيف يمكنني مساعدتك؟";
      if (text.includes("سلام")) reply = "وعليكم السلام! كيدير؟ معك بوت SYN.";

      // إرسال الرد
      try {
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
          data: { messaging_product: "whatsapp", to: from, text: { body: reply } },
          headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
        });
      } catch (err) { console.log("خطأ في الإرسال"); }
    }
    res.sendStatus(200);
  } else { res.sendStatus(404); }
});

app.listen(process.env.PORT || 3000, () => console.log('Bot is ready!'));
