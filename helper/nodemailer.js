const nodemailer = require("nodemailer");

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Function to send email
const emailWithNodeMailer = async (emailData) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USERNAME, // sender address
      to: emailData.email, // recipient address
      subject: emailData.subject, // Subject line
      html: emailData.html, // HTML body
    };

    // Send email
   await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
  
};

module.exports = emailWithNodeMailer;
