import nodemailer from 'nodemailer';
import { email, emailPass } from '../env';
import { Logger } from '../db/bunSqlite/Logger';

// Define the email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Outlook SMTP server
  port: 587, // Port for Outlook
  secure: false,
  tls: {
    ciphers: 'SSLv3', // Ensure compatibility with Outlook
  },
  auth: {
    user: email, // Your email address
    pass: emailPass, // Your email password or app-specific password
  },
});

// Function to send an email
export const sendEmail = (
  to: string,
  subject: string,
  html?: string
): Promise<string|null> => {

  return new Promise(async(resolve,reject)=>{

  const mailOptions = {
      from: email, // Sender address
      to, // Recipient address
      subject,
      // text, // Plain text body
      html, // HTML body (optional)
    };
    
    // Send the email
    transporter.sendMail(mailOptions)
    .then(()=>{
      resolve("Mensaje enviado con exito")
    })
    .catch((e)=>{
      Logger.error("No se puedo enviar correo",JSON.stringify(e))
      reject(null)
    })
  })
}