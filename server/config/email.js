const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const verifyEmailConnection = async () => {
    try {

        await transporter.verify();

        console.log("Email SMTP connection successful");

    } catch (error) {

        console.error(
            "Email SMTP connection failed:",
            error.message
        );
    }
};

module.exports = {
    transporter,
    verifyEmailConnection
};