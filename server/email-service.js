const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

transporter.verify((error) => {
    if (error) {
        console.error("❌ Error with email configuration:", error);
    } else {
        console.log("✅ Email server is ready");
    }
});

handlebars.registerHelper("safe", function (obj, key) {
    return obj && obj[key] ? obj[key] : "";
});

handlebars.registerHelper("formatCurrency", function (amount) {
    return Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
});

handlebars.registerHelper("formatDate", function (date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
});

handlebars.registerHelper("isEqual", function (a, b) {
    return a === b;
});

const sendEmail = async (
    to,
    subject,
    templateName,
    templateData,
    attachments = [],
) => {
    try {
        const templatePath = path.join(
            __dirname,
            "../email-templates",
            `${templateName}.hbs`,
        );

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const templateContent = fs.readFileSync(templatePath, "utf8");
        const template = handlebars.compile(templateContent);
        const htmlContent = template(templateData);

        const mailOptions = {
            from: `"Polygon Agro" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
            attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw error;
    }
};

const sendWelcomeEmail = async (supplierName, email, contact, tempPassword) => {
    const templatePath = path.join(
        __dirname,
        "../email-templates",
        "govishop-welcome.hbs",
    );

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateContent);
    const htmlContent = template({
        supplierName,
        contact,
        email,
        tempPassword,
        loginUrl: process.env.APP_LOGIN_URL || "https://yourapp.com/login",
        year: new Date().getFullYear(),
    });

    const mailOptions = {
        from: `"GoViShop Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to GoViShop – Your Standard Plan is Activated",
        html: htmlContent,
        attachments: [
            {
                filename: "govishop_logo.png",
                path: path.join(__dirname, "../email-templates/govishop_logo.png"),
                cid: "govishop_logo",
            },
        ],
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
};

module.exports = { sendEmail, sendWelcomeEmail };
