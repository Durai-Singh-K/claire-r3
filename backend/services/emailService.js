import pkg from 'nodemailer';
const { createTransport } = pkg;

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use SMTP
    return createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development: Use Ethereal (fake SMTP)
    console.log('Using Ethereal for email testing');
    console.log('Create account at: https://ethereal.email/');
    return createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_USER || 'your-ethereal-user@ethereal.email',
        pass: process.env.SMTP_PASS || 'your-ethereal-password'
      }
    });
  }
};

const transporter = createTransporter();

/**
 * Send email
 * @param {object} options - Email options
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.VITE_APP_NAME || 'B2B Platform'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${process.env.VITE_APP_NAME || 'B2B Platform'}!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.displayName},</h2>
          <p>Thank you for joining our B2B textile platform! We're excited to have you.</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your business profile</li>
            <li>Add your products</li>
            <li>Connect with other businesses</li>
            <li>Join relevant communities</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/onboarding" class="button">Complete Your Profile</a>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The ${process.env.VITE_APP_NAME || 'B2B Platform'} Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ${process.env.VITE_APP_NAME || 'B2B Platform'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Welcome to ${process.env.VITE_APP_NAME || 'B2B Platform'}!`,
    html,
    text: `Welcome to ${process.env.VITE_APP_NAME || 'B2B Platform'}, ${user.displayName}!`
  });
};

/**
 * Send product inquiry notification
 */
export const sendProductInquiryEmail = async (seller, product, inquiry) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Product Inquiry!</h2>
        <p>Hi ${seller.displayName},</p>
        <p>You have received a new inquiry for your product:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <h3>${product.name}</h3>
          <p><strong>Message:</strong> ${inquiry.message}</p>
          ${inquiry.quantity ? `<p><strong>Quantity:</strong> ${inquiry.quantity}</p>` : ''}
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL}/products/${product._id}"
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
            View Product
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: seller.email,
    subject: `New Inquiry for ${product.name}`,
    html
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendProductInquiryEmail
};
