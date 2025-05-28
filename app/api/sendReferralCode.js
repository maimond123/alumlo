import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    // Create a transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'david@alumintel.com', // Your email address
        pass: process.env.EMAIL_PASS, // Your email password
      },
    });

    // Email options
    let mailOptions = {
      from: '"Alumlo" <david@alumlo.com>', // Sender address
      to: email, // List of receivers
      subject: 'Your Alumlo Demo Code Request', // Subject line
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