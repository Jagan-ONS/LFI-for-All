import nodemailer from 'nodemailer';
import { emitToUser } from '../utils/socket.js';
import { ApiError } from '../utils/ApiError.js';

// --- 1. EMAIL (NODEMAILER) SETUP ---

// This transporter is the "mailman". It's configured to send email.
// We'll use Gmail for this example.
// IMPORTANT: You MUST use an "App Password" for Gmail, not your real password.
// 1. Go to your Google Account > Security
// 2. Enable 2-Step Verification
// 3. Go to "App Passwords", create a new one, and use that password here.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address (e.g., "lfi.reminders@gmail.com")
        pass: process.env.EMAIL_PASS, // Your 16-character App Password
    },
});

/**
 * Sends an email notification.
 */
const sendEmailNotification = async (user, reminder) => {
    if (!user.email) {
        console.warn(`User ${user._id} has no email. Skipping email notification.`);
        return;
    }

    const mailOptions = {
        from: `"LFI Reminders" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Reminder: ${reminder.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Upcoming Reminder: ${reminder.title}</h2>
                <p><strong>Category:</strong> ${reminder.category}</p>
                <p><strong>Time:</strong> ${new Date(reminder.remindAt).toLocaleString()}</p>
                <hr>
                <p><strong>Notes:</strong></p>
                <p>${reminder.description.replace(/\n/g, '<br>')}</p>
                ${reminder.externalUrl ? `<p><a href="${reminder.externalUrl}">Join Event</a></p>` : ''}
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to ${user.email}`);
    } catch (error) {
        // Don't crash the server, just log the error
        console.error(`Error sending email to ${user.email}:`, error);
    }
};

// --- 2. IN-APP (SOCKET.IO) NOTIFICATION ---

/**
 * Sends a real-time in-app notification.
 * @param {object} io - The main Socket.IO server instance.
 */
const sendInAppNotification = (io, user, reminder) => {
    emitToUser(io, user._id, 'new_reminder', reminder);
};


// --- 3. MAIN SERVICE FUNCTION ---

/**
 * Main notification function called by the scheduler.
 * It decides which notifications to send.
 */
export const sendNotification = async (io, user, reminder) => {
    if (!user || !reminder) {
        throw new ApiError(500, "User or Reminder data is missing for notification");
    }

    // 1. Always try to send the in-app notification
    sendInAppNotification(io, user, reminder);

    // 2. Also send an email
    // (In the future, you could add a user setting: `if (user.settings.enableEmail)`)
    await sendEmailNotification(user, reminder);
};