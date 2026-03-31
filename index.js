const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

// --- إعدادات الحساب (كلشي واجد) ---
const VERIFY_TOKEN = "maroc_bot_2024";
const WHATSAPP_TOKEN = "EAARpeqfyTZAgBRFPYIR3dXVGsEkMDXPZAYfxerdhKqjc2Yq0NCNuZBdoAKzbOZA8yXLjSWmZBF7a6APHKFhVN4b0dIr99BRjIcDokYTzeBbSIx0wiZADjYMFi4949Fbp2Sb7pucvugQzk7ocnisg1udYtzZA5PkUnZCqZC0nTDkLYGIgdcXOm0HhBrothJmFBxIZAwjhXqYX4zwgzFFZBzcer9KaRcb8k4CyZCivwYZAEthfplmWCNlaCFxSJ0juFh7YYzQ96hQZBsbmW7ZBhD9OmrCvT8PnsZCY";
const PHONE_NUMBER_ID = "1021334914401055"; 
const GEMINI_API_KEY = "AIzaSyBWzUiqUc_CDtSviHcJZJf4jfupHde81I4";
// ---------------------------------

// التحقق من الـ Webhook
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

// استقبال الميساجات والرد عليها بالذكاء الاصطناعي
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account' && body.entry?.[0].changes?.[0].value.messages?.[0]) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const from = msg.from;
            const userText = msg.text.body;

            console.log(`[SYN-BOT] ميساج من ${from}: ${userText}`);

            // 1. طلب الجواب من Gemini AI بلهجة مغربية
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const geminiResponse = await axios.post(geminiUrl, {
                contents: [{
                    parts: [{ text: `أنت مساعد ذكي لشركة SYN (وكالة خدمات رقمية مغربية متخصصة في المونتاج وكتابة المحتوى). جاوب الكليان بالدارجة المغربية بأسلوب مهني، ذكي، ومؤدب. السؤال هو: ${userText}` }]
                }]
            });

            const aiReply = geminiResponse.data.candidates[0].content.parts[0].text;

            // 2. إرسال الرد لواتساب
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
        console.error("خطأ:", error.response ? JSON.stringify(error.response.data) : error.message);
        res.sendStatus(200);
    }
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 SYN AI Bot is ready to chat!'));
