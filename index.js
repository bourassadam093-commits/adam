const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express().use(express.json());

// --- الإعدادات ---
const VERIFY_TOKEN = "maroc_bot_2024";
const WHATSAPP_TOKEN = "EAARpeqfyTZAgBRFPYIR3dXVGsEkMDXPZAYfxerdhKqjc2Yq0NCNuZBdoAKzbOZA8yXLjSWmZBF7a6APHKFhVN4b0dIr99BRjIcDokYTzeBbSIx0wiZADjYMFi4949Fbp2Sb7pucvugQzk7ocnisg1udYtzZA5PkUnZCqZC0nTDkLYGIgdcXOm0HhBrothJmFBxIZAwjhXqYX4zwgzFFZBzcer9KaRcb8k4CyZCivwYZAEthfplmWCNlaCFxSJ0juFh7YYzQ96hQZBsbmW7ZBhD9OmrCvT8PnsZCY";
const PHONE_NUMBER_ID = "1021334914401055"; 
const genAI = new GoogleGenerativeAI("AIzaSyBWzUiqUc_CDtSviHcJZJf4jfupHde81I4");
// -----------------

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
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account' && body.entry?.[0].changes?.[0].value.messages?.[0]) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const from = msg.from;
            const userText = msg.text.body;

            console.log(`[SYN-BOT] ميساج: ${userText}`);

            // استخدام المكتبة الرسمية
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `أنت مساعد ذكي لشركة SYN مغربي. جاوب بالدارجة: ${userText}`;
            
            const result = await model.generateContent(prompt);
            const aiReply = result.response.text();

            // إرسال الرد
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
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("خطأ:", error.message);
        res.sendStatus(200);
    }
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 SYN AI Bot is LIVE with Official SDK!'));
