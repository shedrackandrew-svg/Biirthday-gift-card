const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Twilio = require('twilio');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));

const UPLOAD_DIR = path.join(__dirname, 'public','uploads');
if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, {recursive:true});
app.use('/uploads', express.static(path.join(__dirname,'public','uploads')));

// Environment variables (set these in your hosting platform)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // format: whatsapp:+1415...

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT==465,
  auth: SMTP_USER?{user:SMTP_USER,pass:SMTP_PASS}:undefined
});

let twilioClient = null;
if(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.post('/send', async (req, res) => {
  try{
    const {name, phone, email, gender, birthday, image} = req.body;
    if(!name) return res.status(400).json({error:'name required'});

    // save image (data URL expected)
    let imageUrl = null;
    if(image && image.startsWith('data:')){
      const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if(matches){
        const ext = matches[1].split('/')[1] || 'png';
        const base64Data = matches[2];
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      }
    }

    // send email with attachment if SMTP configured
    if(SMTP_HOST && email){
      const mailOpts = {
        from: SMTP_USER || 'no-reply@example.com',
        to: email,
        subject: `A Gift Card for ${name}`,
        text: `Hi ${name},\n\nYou received a gift card!`,
        attachments: []
      };
      if(imageUrl){
        const localPath = path.join(UPLOAD_DIR, path.basename(imageUrl));
        mailOpts.attachments.push({filename: path.basename(localPath), path: localPath});
      }
      await transporter.sendMail(mailOpts);
    }

    // send WhatsApp via Twilio if configured and phone provided
    if(twilioClient && TWILIO_WHATSAPP_FROM && phone){
      const params = {from: TWILIO_WHATSAPP_FROM, to: `whatsapp:${phone}`};
      if(imageUrl) params.mediaUrl = [imageUrl];
      params.body = `Hi ${name}! You have a gift card.`;
      await twilioClient.messages.create(params);
    }

    return res.json({ok:true, imageUrl});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));
