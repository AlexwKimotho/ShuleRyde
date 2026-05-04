const { uploadMedia, sendDocument } = require('../services/whatsappService');

const sendWhatsAppDocument = async (req, res) => {
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
    return res.status(503).json({ error: 'WhatsApp API not configured' });
  }

  const { phone, caption, filename } = req.body;
  const file = req.file;

  if (!file || !phone) {
    return res.status(400).json({ error: 'Missing pdf or phone' });
  }

  try {
    const mediaId = await uploadMedia(file.buffer, filename || 'document.pdf');
    const result = await sendDocument(phone, mediaId, caption || '', filename || 'document.pdf');
    res.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { sendWhatsAppDocument };
