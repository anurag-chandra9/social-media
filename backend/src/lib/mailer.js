import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password here
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Error verifying mail transporter:", error);
  } else {
    console.log("Mail server is ready to send emails");
  }
});

export const sendResetPasswordEmail = async (to, resetToken) => {
  // Get the base URL based on environment
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://social-media-cs6p.onrender.com'
    : 'http://localhost:5173';

  const resetUrl = `${baseURL}/reset-password/${resetToken}`;

  console.log('Reset password URL:', resetUrl); // For debugging

  const mailOptions = {
    from: `"Password Reset" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          You requested to reset your password. Click the button below to set a new password. 
          This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">
          If you didn't request this, please ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}; 