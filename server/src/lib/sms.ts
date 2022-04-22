import twilio from 'twilio'

export interface SmsServiceOptions {
  fromNumber: string
  accountSid: string
  authToken: string
}

export class SmsService {
  private twilio: twilio.Twilio
  constructor(private options: SmsServiceOptions) {
    this.twilio = new twilio.Twilio(options.accountSid, options.authToken, {
      lazyLoading: true,
    })
  }

  async sendSms(message: { to: string; body: string }) {
    await this.twilio.messages.create({
      from: this.options.fromNumber,
      ...message,
    })
  }
}
