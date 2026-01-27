/**
 * Email Service
 * Handles email sending via SMTP, SendGrid, or AWS SES
 */

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  from?: string;
}

class EmailService {
  private provider: "smtp" | "sendgrid" | "ses" | "console";
  private config: Record<string, any>;

  constructor() {
    // Determine email provider from environment
    this.provider =
      (process.env.EMAIL_PROVIDER as any) || "console";
    
    this.config = {
      smtp: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
      ses: {
        region: process.env.AWS_SES_REGION || "us-east-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = options.from || process.env.EMAIL_FROM || "noreply@ais.akafay.com";
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // In console mode (default), just log the email
    if (this.provider === "console" || !this.provider) {
      console.log("📧 Email (console mode):", {
        to: recipients,
        subject: options.subject,
        text: options.text,
        attachments: options.attachments?.map((a) => a.filename),
      });
      return;
    }

    // For other providers, try to send but fallback to console if packages not available
    try {
      switch (this.provider) {
        case "sendgrid":
          await this.sendViaSendGrid({ ...options, from, to: recipients });
          break;
        case "ses":
          await this.sendViaSES({ ...options, from, to: recipients });
          break;
        case "smtp":
          await this.sendViaSMTP({ ...options, from, to: recipients });
          break;
        default:
          console.log("📧 Email (console mode - unknown provider):", {
            to: recipients,
            subject: options.subject,
          });
      }
    } catch (error: any) {
      // If provider package not installed, fallback to console mode
      if (error.message?.includes("not installed")) {
        console.warn(`Email provider '${this.provider}' not available, using console mode:`, error.message);
        console.log("📧 Email (console fallback):", {
          to: recipients,
          subject: options.subject,
          text: options.text,
          attachments: options.attachments?.map((a) => a.filename),
        });
      } else {
        throw error;
      }
    }
  }

  private async sendViaSendGrid(options: EmailOptions & { from: string; to: string[] }): Promise<void> {
    // Use eval to prevent webpack from trying to bundle this at build time
    const importSendGrid = new Function('return import("@sendgrid/mail")');
    
    try {
      // Dynamic import to avoid requiring sendgrid in all environments
      const sgMail = await importSendGrid();
      
      if (!this.config.sendgrid.apiKey) {
        throw new Error("SENDGRID_API_KEY not configured");
      }

      sgMail.default.setApiKey(this.config.sendgrid.apiKey);

      const msg: any = {
        to: options.to,
        from: options.from,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments.map((att) => ({
          content: Buffer.isBuffer(att.content)
            ? att.content.toString("base64")
            : Buffer.from(att.content).toString("base64"),
          filename: att.filename,
          type: att.contentType,
          disposition: "attachment",
        }));
      }

      await sgMail.default.send(msg);
    } catch (error: any) {
      console.error("SendGrid email error:", error);
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }

  private async sendViaSES(options: EmailOptions & { from: string; to: string[] }): Promise<void> {
    // Use eval to prevent webpack from trying to bundle this at build time
    const importSES = new Function('return import("@aws-sdk/client-ses")');
    
    try {
      // Dynamic import to avoid requiring AWS SDK in all environments
      const awsSes = await importSES();
      const { SESClient, SendEmailCommand } = awsSes;
      
      if (!this.config.ses.accessKeyId || !this.config.ses.secretAccessKey) {
        throw new Error("AWS credentials not configured");
      }

      const sesClient = new SESClient({
        region: this.config.ses.region,
        credentials: {
          accessKeyId: this.config.ses.accessKeyId,
          secretAccessKey: this.config.ses.secretAccessKey,
        },
      });

      // Note: SES attachments require S3 or separate email with attachment
      // For simplicity, we'll send text-only emails
      const command = new SendEmailCommand({
        Source: options.from,
        Destination: {
          ToAddresses: options.to,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: options.text || options.html || "",
              Charset: "UTF-8",
            },
          },
        },
      });

      await sesClient.send(command);
    } catch (error: any) {
      console.error("AWS SES email error:", error);
      throw new Error(`Failed to send email via SES: ${error.message}`);
    }
  }

  private async sendViaSMTP(options: EmailOptions & { from: string; to: string[] }): Promise<void> {
    // Use eval to prevent webpack from trying to bundle this at build time
    const importNodemailer = new Function('return import("nodemailer")');
    
    try {
      // Dynamic import to avoid requiring nodemailer in all environments
      const nodemailer = await importNodemailer();
      
      if (!this.config.smtp.user || !this.config.smtp.password) {
        throw new Error("SMTP credentials not configured");
      }

      const transporter = nodemailer.default.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.user,
          pass: this.config.smtp.password,
        },
      });

      const mailOptions: any = {
        from: options.from,
        to: options.to.join(", "),
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        }));
      }

      await transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error("SMTP email error:", error);
      throw new Error(`Failed to send email via SMTP: ${error.message}`);
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

export { EmailService, type EmailOptions, type EmailAttachment };

