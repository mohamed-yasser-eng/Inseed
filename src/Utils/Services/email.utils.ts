import nodemailer from 'nodemailer'
import { IEmailArgument } from '../../Common'

export const sendEmail = async ({ to, cc, subject, content, attachments = [] }: IEmailArgument) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service: 'Gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_EMAIL_PASSWORD,
    },
  })

  const info = await transporter.sendMail({
    from: `"NO-REPLY" <${process.env.USER_EMAIL}>`,
    to,
    cc,
    subject,
    html: content,
    attachments,
  })
  return info
}

import { EventEmitter } from 'node:events'
export const localEventEmitter = new EventEmitter()

// localEventEmitter.on('sendEmail',(args:IEmailArgument)=>{
//     console.log('sending email event has started');
//     sendEmail(args)
// })

localEventEmitter.on('sendEmail', async (args: IEmailArgument) => {
  try {
    console.log('sending email event has started')
    await sendEmail(args)
    console.log('email sent successfully')
  } catch (error) {
    console.error('email sending failed:', error)
  }
})
