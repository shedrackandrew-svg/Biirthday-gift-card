const nodemailer = require('nodemailer');
const Twilio = require('twilio');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send({error:'Method not allowed'});
  try{
    const {name, phone, email, gender, birthday, image} = req.body || {};
    if(!name) return res.status(400).json({error:'name required'});

    // Save image to /tmp for attachment (serverless environment)
    let attachment = null;
    if(image && image.startsWith('data:')){
      const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if(matches){
        const ext = matches[1].split('/')[1] || 'png';
        const base64Data = matches[2];
        const filename = `gift-${Date.now()}.${ext}`;
        const tmpPath = path.join('/tmp', filename);
        fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));
        attachment = {filename, path: tmpPath};
      }
    }

    // Email via SMTP
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || 587;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if(SMTP_HOST && email){
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT==465,
        auth: SMTP_USER?{user:SMTP_USER,pass:SMTP_PASS}:undefined
      });
      const mailOpts = {from: SMTP_USER||'no-reply@example.com', to: email, subject:`A gift card for ${name}`, text:`Hi ${name}, you received a gift card!`, attachments: []};
      if(attachment) mailOpts.attachments.push(attachment);
      await transporter.sendMail(mailOpts);
    }

    // WhatsApp via Twilio
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+123...
    if(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM && phone){
      const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const params = {from: TWILIO_WHATSAPP_FROM, to: `whatsapp:${phone}`};
      if(attachment){
        // If on Vercel, attachments need to be publicly hosted; as a fallback send text
        params.body = `Hi ${name}! You received a gift card.`;
      } else {
        params.body = `Hi ${name}! You received a gift card.`;
      }
      await client.messages.create(params);
    }

    res.json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
};
