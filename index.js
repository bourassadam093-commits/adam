/**
 * WhatsApp Bot with Gemini AI - SYN Digital Services
 * Using Gemini Pro with v1 API
 */

import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================
const WHATSAPP_TOKEN = 'EAARpeqfyTZAgBRFPYIR3dXVGsEkMDXPZAYfxerdhKqjc2Yq0NCNuZBdoAKzbOZA8yXLjSWmZBF7a6APHKFhVN4b0dIr99BRjIcDokYTzeBbSIx0wiZADjYMFi4949Fbp2Sb7pucvugQzk7ocnisg1udYtzZA5PkUnZCqZC0nTDkLYGIgdcXOm0HhBrothJmFBxIZAwjhXqYX4zwgzFFZBzcer9KaRcb8k4CyZCivwYZAEthfplmWCNlaCFxSJ0juFh7YYzQ96hQZBsbmW7ZBhD9OmrCvT8PnsZCY';
const PHONE_NUMBER_ID = '1021334914401055';
const VERIFY_TOKEN = 'maroc_bot_2024';
const WHATSAPP_API_VERSION = 'v18.0';

// Gemini API Configuration - Using gemini-pro with v1
const GEMINI_API_KEY = 'AIzaSyBWzUiqUc_CDtSviHcJZJf4jfupHde81I4';
const GEMINI_MODEL = 'gemini-pro';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

// System prompt for Moroccan Darija
const SYSTEM_PROMPT = `You are an AI assistant for SYN Digital Services (SYN للخدمات الرقمية), a Moroccan digital services company.

IMPORTANT: You MUST respond ONLY in Moroccan Darija (الدارجة المغربية), never in French, Classical Arabic, or English.

Guidelines:
- Use natural Moroccan expressions (كيفاش, واش, علاش, غادي, كيتعاونو)
- Keep responses concise but helpful
- Be friendly and professional
- Sign off as "SYN للخدمات الرقمية 🎯"
- Company services: Web Development, Mobile Apps, Digital Marketing, IT Consulting`;

// Conversation history storage
const conversationHistory = new Map();

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
        return response.data;
    } catch (error) {
        console.error('WhatsApp Error:', error.response?.data || error.message);
        throw error;
    }
}

// ============================================
// CALL GEMINI API (Axios - Manual HTTP Request)
// ============================================
async function getGeminiResponse(userMessage, userId) {
    // Get conversation history for user
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    try {
        // Build request payload
        const requestPayload = {
            contents: [
                ...history.map(item => ({
                    role: item.role,
                    parts: [{ text: item.text }]
                })),
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ],
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1000,
                topP: 0.95,
                topK: 40
            }
        };

        // API URL with API key as query parameter
        const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

        console.log('🤖 Calling Gemini API (gemini-pro v1)...');

        // Make request using Axios
        const response = await axios.post(url, requestPayload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        // Extract response text
        const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return "عذراً، مقدر نجاوب عليك فهاد الوقت. جرب مرة أخرى من بعد.";
        }

        // Update conversation history
        history.push({ role: 'user', text: userMessage });
        history.push({ role: 'model', text: responseText });

        // Keep only last 10 exchanges
        if (history.length > 20) {
            history.shift();
            history.shift();
        }

        return responseText;

    } catch (error) {
        console.error('❌ Gemini API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            return "عذراً، عندنا مشكل مع الخادم ديال الذكاء الاصطناعي. جرب مرة أخرى من بعد.";
        }
        if (error.response?.status === 429) {
            return "عذراً، الطلبات كثيرة شوية. استنى شوية وجرب من جديد.";
        }
        return "عذراً، مقدر نجاوب عليك فهاد الوقت.";
    }
}

// ============================================
// PROCESS INCOMING MESSAGE
// ============================================
async function processMessage(senderPhone, messageBody) {
    console.log(`📨 Message from ${senderPhone}: ${messageBody}`);
    
    try {
        const aiResponse = await getGeminiResponse(messageBody, senderPhone);
        await sendWhatsAppMessage(senderPhone, aiResponse);
    } catch (error) {
        console.error('Process Error:', error);
        await sendWhatsAppMessage(senderPhone, "عذراً، عندنا مشكل تقني.");
    }
}

// ============================================
// WHATSAPP WEBHOOK ENDPOINTS
// ============================================

// GET /webhook - WhatsApp Verification
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

// POST /webhook - Receive Messages
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
        console.error('Webhook Error:', error);
        res.sendStatus(500);
    }
});

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: '✅ Bot Running',
        service: 'SYN للخدمات الرقمية',
        gemini: GEMINI_MODEL,
        version: 'v1'
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SYN WhatsApp Bot running on port ${PORT}`);
    console.log(`🤖 Using: ${GEMINI_MODEL} with v1 API`);
});
