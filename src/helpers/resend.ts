import { Resend } from 'resend';
import { resendAPIKEY } from '../env';
import { Logger } from '../db/bunSqlite/Logger';

const resend = new Resend(resendAPIKEY)

export const sendEmail = (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  return new Promise(async(resolve,reject)=>{
    try {
      const data = await resend.emails.send({
        from: 'no-reply@rpm-vic.xyz', 
        to,
        subject,
        html
      });
      
      // Log successful sends if needed
      Logger.info(`Email sent to ${to}`,JSON.stringify( data));
      resolve();
    } catch(e: any) {
      let message = `Failed to send email to ${to}`;
      
      // More specific error handling
      if (e?.message?.includes('domain not verified')) {
        message += ' - Sender domain not verified';
      } else if (e?.message?.includes('blocked')) {
        message += ' - Recipient server blocked the email';
      }
      
      Logger.error(message, JSON.stringify(e));
      reject(message);
    }
  });
}