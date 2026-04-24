require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendregisteremail(useremail,name) {
    const subject = "Welcome to our platform";
    const text = `Hello ${name}, welcome to our platform`;
    const html = `<h1>Hello ${name}, welcome to our platform</h1>`;
    await sendEmail(useremail, subject, text, html);
}

async function sendtransactionemail(useremail,name,amount,toaccount)
{
    const subject="Transaction Alert";
    const text=`Hello ${name}, you have received ${amount} from ${toaccount}`;
    const html=`<h1>Hello ${name}, you have received ${amount} from ${toaccount}</h1>`;
    await sendEmail(useremail, subject, text, html);
}

async function sendtransactionfailure(useremail,name,amount,toaccount)
{
    const subject="Transaction Alert";
    const text=`Hello ${name}, you have received ${amount} from ${toaccount}`;
    const html=`<h1>Hello ${name}, you have received ${amount} from ${toaccount}</h1>`;
    await sendEmail(useremail, subject, text, html);
}

module.exports = {sendregisteremail,sendtransactionemail,sendtransactionfailure};
