const express = require('express');
const app = express().use(express.json());

const VERIFY_TOKEN = "maroc_bot_2024"; 

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

app.post('/webhook', (req, res) => {
  console.log("وصل ميساج جديد!");
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => console.log('Bot is ready!'));
