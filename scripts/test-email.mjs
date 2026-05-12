import nodemailer from 'nodemailer';

const { NODEMAILER_EMAIL, NODEMAILER_PASSWORD } = process.env;

if (!NODEMAILER_EMAIL || !NODEMAILER_PASSWORD) {
    console.error('❌ Missing NODEMAILER_EMAIL or NODEMAILER_PASSWORD in .env');
    process.exit(1);
}

console.log('📧 SMTP user:', NODEMAILER_EMAIL);
console.log('🔑 Password length:', NODEMAILER_PASSWORD.length, '(Gmail App Passwords are 16 chars, no spaces)');

const recipient = process.argv[2] || NODEMAILER_EMAIL;
console.log('📬 Sending test email to:', recipient);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: NODEMAILER_EMAIL, pass: NODEMAILER_PASSWORD },
});

try {
    console.log('⏳ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection OK');

    console.log('⏳ Sending message...');
    const info = await transporter.sendMail({
        from: `"Signalist Test" <${NODEMAILER_EMAIL}>`,
        to: recipient,
        subject: 'Signalist SMTP test ' + new Date().toISOString(),
        text: 'If you can read this, nodemailer + Gmail are working.',
        html: '<p>If you can read this, nodemailer + Gmail are working.</p>',
    });

    console.log('✅ sendMail resolved');
    console.log('   messageId:', info.messageId);
    console.log('   accepted: ', info.accepted);
    console.log('   rejected: ', info.rejected);
    console.log('   response: ', info.response);
    console.log('\n👉 Check the inbox AND spam folder for:', recipient);
    process.exit(0);
} catch (e) {
    console.error('❌ SMTP send failed');
    console.error('   name:    ', e.name);
    console.error('   code:    ', e.code);
    console.error('   command: ', e.command);
    console.error('   response:', e.response);
    console.error('   message: ', e.message);
    if (e.code === 'EAUTH') {
        console.error('\n💡 EAUTH = wrong username/password. For Gmail you MUST use an App Password (https://myaccount.google.com/apppasswords), not your regular login password. Enable 2FA first if you haven\'t.');
    }
    process.exit(1);
}
