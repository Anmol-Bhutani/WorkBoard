const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInviteEmail = async (toEmail, name, tempPassword, adminName, adminEmail) => {
  const mailOptions = {
    from: `"${adminName} via Ethara AI" <${process.env.EMAIL_USER}>`,
    replyTo: adminEmail,
    to: toEmail,
    subject: `Invitation from ${adminName} to join Ethara AI 🚀`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #0a0a14; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; color: white;">
        <div style="text-align: center; marginBottom: 32px;">
          <h1 style="font-size: 32px; font-weight: 800; color: #7c3aed; margin: 0;">Ethara AI</h1>
          <p style="color: rgba(255,255,255,0.4); margin-top: 8px;">Your Professional AI Workspace</p>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome, ${name}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7); margin-bottom: 32px;">
          You've been invited to join the <strong>Ethara AI</strong> team. Your account has been created and you're ready to start managing projects and tasks.
        </p>
        
        <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px;">Login Email</div>
            <div style="font-size: 16px; font-weight: 700;">${toEmail}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px;">Temporary Password</div>
            <div style="font-size: 16px; font-weight: 700; color: #7c3aed;">${tempPassword}</div>
          </div>
        </div>
        
        <a href="http://localhost:5174/login" style="display: block; text-align: center; background: #7c3aed; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 16px;">
          Log In to Your Workspace
        </a>
        
        <p style="font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 40px;">
          If you didn't expect this invitation, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email Error:', error);
    return false;
  }
};

module.exports = { sendInviteEmail };
