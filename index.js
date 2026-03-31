/**
 * WhatsApp Bot with Gemini AI - SYN Digital Services
 * Using gemini-2.0-flash with v1beta API
 */

import express from 'express';
import axios from 'axios';
import cors from 'cors';

// ============================================
// CONFIGURATION
// ============================================
const WHATSAPP_TOKEN = 'EAARpeqfyTZAgBRJ7eXWckutmO38nbi2rtTbFaZCVGWZBpR0XZBjR8WvyYh2MCnXnEnsPtw6fstP8eWsvdQhQuXoId9ZBmF4HYwgHcOGiGAjdIcAv17Sxrhn7Aqaf4wfYBaZAiNAn8GkUCsiHm6JsRMYXK6YJo9W3SywZC9Ai4iVLSOB16QZAOOZArLkJOANJZApKl1X62ApBVBWHmUBQytBsDoalFEWdWxbbxnHWP4KZAvuPcJAL50DcCkYmvLtzMWAtEMmf0uulTNiGT4iLHPXRsivdfmV';
const PHONE_NUMBER_ID = '1021334914401055';
const VERIFY_TOKEN = 'maroc_bot_2024';
const WHATSAPP_API_VERSION = 'v18.0';

// Gemini API - Using gemini-2.0-flash with v1beta
const GEMINI_API_KEY = 'AIzaSyCnleu99Z0gE9npnLTq-3o--u-0QdLj6UU';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// System prompt for Moroccan Darija
const SYSTEM_PROMPT = `You are an AI assistant for SYN Digital Services (SYN للخدمات الرقمية), a Moroccan digital services company.

IMPORTANT: You MUST respond ONLY in Moroccan Darija (الدارجة المغربية), never in French, Classical Arabic, or English.

Guidelines:
- Use natural Moroccan expressions (كيفاش, واش, علاش, غادي, كيتعاونو)
- Keep responses concise but helpful
- Be friendly and professional
- Sign off as "SYN للخدمات الرقمية 🎯"
- Company services: Web Development, Mobile Apps, Digital Marketing, IT Consulting`;

// ============================================
// EXPRESS APP
// ============================================
const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// SEND MESSAGE TO WHATSAPP
// ============================================
async function sendWhatsAppMessage(recipientPhone, message) {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    try {
        const response = await axios.post(url, {
            messaging_product: 'whatsapp',
            to: recipientPhone,
            type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        }, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Message sent:', response.data.message_id);
        return response.data;
    } catch (error) {
        console.error('❌ WhatsApp Error:', error.response?.data || error.message);
        throw error;
    }
}

// ============================================
// CALL GEMINI API (v1beta - supports systemInstruction)
// ============================================
async function getGeminiResponse(userMessage, userId) {
    try {
        const requestPayload = {
            contents: [{
                role: 'user',
                parts: [{ text: userMessage }]
            }],
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1000
            }
        };

        const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
        console.log('🤖 Calling Gemini API:', GEMINI_MODEL);

        const response = await axios.post(url, requestPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return "عذراً، مقدر نجاوب عليك فهاد الوقت.";
        }

        return responseText;

    } catch (error) {
        console.error('❌ Gemini Error:', error.response?.data || error.message);

        if (error.response?.status === 404) {
            return "عذراً، الموديل مابقاش متوفر. جرب مرة أخرى.";
        }
        if (error.response?.status === 429) {
            return "عذراً، الطلبات كثيرة شوية. استنى شوية وجرب من جديد.";
        }
        return "عذراً، مقدر نجاوب عليك فهاد الوقت.";
    }
}

// ============================================
// PROCESS MESSAGE
// ============================================
async function processMessage(senderPhone, messageBody) {
    console.log(`📨 ${senderPhone}: ${messageBody}`);

    try {
        const aiResponse = await getGeminiResponse(messageBody, senderPhone);
        await sendWhatsAppMessage(senderPhone, aiResponse);
    } catch (error) {
        console.error('❌ Process Error:', error);
    }
}

// ============================================
// WEBHOOK ENDPOINTS
// ============================================

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (!body.object || body.object !== 'whatsapp_business_account') {
        return res.sendStatus(404);
    }

    try {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.value?.messages) {
                    for (const message of change.value.messages) {
                        if (message.type === 'text' && message.text?.body) {
                            processMessage(message.from, message.text.body);
                        }
                    }
                }
            }
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.sendStatus(500);
    }
});

app.get('/', (req, res) => {
    res.json({
        status: '✅ Bot Running',
        service: 'SYN للخدمات الرقمية',
        gemini: GEMINI_MODEL
    });
});

// ============================================
// START
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SYN Bot running on port ${PORT}`);
    console.log(`🤖 Gemini Model: ${GEMINI_MODEL}`);
    console.log(`📱 Phone ID: ${PHONE_NUMBER_ID}`);
});
