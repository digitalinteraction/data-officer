import { MailService as Sendgrid } from '@sendgrid/mail'
import { MailData } from '@sendgrid/helpers/classes/mail'

export interface EmailServiceOptions {
  apiKey: string
  replyToEmail: string
  fromEmail: string
  templateId: string
}

export class EmailService {
  private get mailOptions(): MailData {
    return {
      replyTo: this.options.replyToEmail,
      from: this.options.fromEmail,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
        subscriptionTracking: { enable: false },
        ganalytics: { enable: false },
      },
    }
  }

  private mail: Sendgrid
  constructor(private options: EmailServiceOptions) {
    this.mail = new Sendgrid()
    this.mail.setApiKey(options.apiKey)
  }

  async sendEmail(options: { to: string; subject: string; html: string }) {
    await this.mail.send({
      ...this.mailOptions,
      ...options,
    })
  }
}
