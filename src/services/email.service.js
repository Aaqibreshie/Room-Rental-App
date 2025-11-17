import nodemailer from "nodemailer";
import config from "../config/config.js";
import logger from "../utils/logger.js";

// Create transporter for email sending
const transporter = nodemailer.createTransport({
  service: config.EMAIL_SERVICE,
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
});

/**
 * Forgot Password Email Template
 */
const forgotPasswordTemplate = (name, resetUrl, expiryTime) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
        .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Room Rental Platform</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          <div class="warning">
            <strong>⏱️ This link expires in ${expiryTime}</strong>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </div>
        <div class="footer">
          <p>If you have questions, contact us at support@roomrental.com</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Welcome Email Template
 */
const welcomeTemplate = (name, email, role) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .feature { margin: 10px 0; padding: 10px; background-color: #ecf0f1; border-left: 4px solid #3498db; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Room Rental Platform!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for signing up as a <strong>${role}</strong>!</p>
          <p>You can now:</p>
          <div class="feature">
            <strong>🏠 Browse Listings</strong> - Find rooms that match your needs
          </div>
          <div class="feature">
            <strong>💬 Contact Landlords</strong> - Connect directly with property owners
          </div>
          <div class="feature">
            <strong>❤️ Save Favorites</strong> - Bookmark rooms you like
          </div>
          <p>Your login email: <strong>${email}</strong></p>
        </div>
        <div class="footer">
          <p>Email: support@roomrental.com</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Booking Request Email Template
 */
const bookingRequestTemplate = (
  landlordName,
  tenantName,
  roomTitle,
  moveInDate
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #2980b9; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .details { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2980b9; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Booking Request</h1>
        </div>
        <div class="content">
          <p>Hi ${landlordName},</p>
          <p><strong>${tenantName}</strong> has sent a booking request for your property.</p>
          <div class="details">
            <p><strong>📍 Room:</strong> ${roomTitle}</p>
            <p><strong>📅 Move-in Date:</strong> ${new Date(moveInDate).toLocaleDateString()}</p>
            <p><strong>👤 Tenant:</strong> ${tenantName}</p>
          </div>
          <p>Log in to your dashboard to view the full booking details and respond.</p>
          <center>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Booking</a>
          </center>
        </div>
        <div class="footer">
          <p>Please respond to this booking within 24 hours.</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Booking Approved Email Template
 */
const bookingApprovedTemplate = (tenantName, roomTitle, moveInDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .success { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #27ae60; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Booking Approved!</h1>
        </div>
        <div class="content">
          <p>Hi ${tenantName},</p>
          <p>Great news! Your booking has been approved.</p>
          <div class="success">
            <p><strong>📍 Room:</strong> ${roomTitle}</p>
            <p><strong>📅 Move-in Date:</strong> ${new Date(moveInDate).toLocaleDateString()}</p>
          </div>
          <p>Next steps:</p>
          <p>1. Complete payment on the platform</p>
          <p>2. Wait for landlord confirmation</p>
          <p>3. Prepare for move-in on the scheduled date</p>
        </div>
        <div class="footer">
          <p>If you have questions, contact us at support@roomrental.com</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Booking Rejected Email Template
 */
const bookingRejectedTemplate = (tenantName, rejectionReason) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .reason { background-color: #fadbd8; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #e74c3c; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Booking Request Declined</h1>
        </div>
        <div class="content">
          <p>Hi ${tenantName},</p>
          <p>Unfortunately, your booking request has been declined.</p>
          <div class="reason">
            <p><strong>Reason:</strong> ${rejectionReason}</p>
          </div>
          <p>Don't worry! There are many other great rooms available. Keep exploring!</p>
          <p>Feel free to contact the landlord directly if you have any questions.</p>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@roomrental.com</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Booking Cancelled Email Template
 */
const bookingCancelledTemplate = (landlordName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { background-color: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📌 Booking Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi ${landlordName},</p>
          <p>A tenant has cancelled their booking request for your property.</p>
          <p>Your room is now available for other booking requests.</p>
          <p>Continue maintaining your property and attracting new tenants!</p>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@roomrental.com</p>
          <p>&copy; 2025 Room Rental Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Main send email function
 */
export const sendEmail = async (options) => {
  try {
    let htmlContent;

    switch (options.template) {
      case "forgotPassword":
        htmlContent = forgotPasswordTemplate(
          options.data.name,
          options.data.resetUrl,
          options.data.expiryTime
        );
        break;
      case "welcome":
        htmlContent = welcomeTemplate(
          options.data.name,
          options.data.email,
          options.data.role
        );
        break;
      case "bookingRequest":
        htmlContent = bookingRequestTemplate(
          options.data.landlordName,
          options.data.tenantName,
          options.data.roomTitle,
          options.data.moveInDate
        );
        break;
      case "bookingApproved":
        htmlContent = bookingApprovedTemplate(
          options.data.tenantName,
          options.data.roomTitle,
          options.data.moveInDate
        );
        break;
      case "bookingRejected":
        htmlContent = bookingRejectedTemplate(
          options.data.tenantName,
          options.data.rejectionReason
        );
        break;
      case "bookingCancelled":
        htmlContent = bookingCancelledTemplate(options.data.landlordName);
        break;
      default:
        throw new Error("Unknown email template");
    }

    const mailOptions = {
      from: config.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Verify email transporter
 */
export const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();
    logger.info("Email transporter verified successfully");
    return true;
  } catch (error) {
    logger.error("Email transporter verification failed:", error);
    return false;
  }
};

export default { sendEmail, verifyEmailTransporter };
