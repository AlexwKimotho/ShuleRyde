const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BASE_URL = `https://graph.facebook.com/v20.0`;

async function uploadMedia(buffer, filename) {
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);
  formData.append('type', 'application/pdf');
  formData.append('messaging_product', 'whatsapp');

  const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp media upload failed: ${err}`);
  }
  const data = await res.json();
  return data.id;
}

async function sendDocument(toPhone, mediaId, caption, filename) {
  const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'document',
      document: { id: mediaId, caption, filename },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }
  return await res.json();
}

module.exports = { uploadMedia, sendDocument };
