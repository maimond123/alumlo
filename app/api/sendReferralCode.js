import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.your-email-provider.com', // Replace with your email provider's SMTP server
      port: 587, // Replace with the appropriate port
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'david@alumintel.com', // Your email address
        pass: 'nahroc-kIdfy9-migcyq', // Your email password or app-specific password
      },
    });

    // Set up email data
    const mailOptions = {
      from: '"AlumIntel" <david@alumintel.com>', // Sender address
      to: email, // List of receivers
      subject: 'Your AlumIntel Demo Code Request', // Subject line
      text: 'Thank you for your interest! You will receive your demo referral code within the next few hours.', // Plain text body
      html: '<p>Thank you for your interest! You will receive your demo referral code within the next few hours.</p>', // HTML body
    };

    try {
      // Send mail
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}