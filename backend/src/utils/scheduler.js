import cron from 'node-cron';
import { Reminder } from '../models/reminder.model.js';
import { sendNotification } from '../services/notification.service.js';
import { parseExpression } from 'cron-parser'; // You need: npm install cron-parser

/**
 * Initializes and starts the reminder scheduler.
 * This function is called once from app.js or index.js.
 * @param {object} io - The main Socket.IO server instance.
 */
export function startScheduler(io) {
    console.log("⏰ Reminder scheduler started. Will check for reminders every minute.");

    // This schedules a task to run every minute, every day.
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        
        // --- BLOCK 1: Handle 10-Minute Warnings for Time-Sensitive Events ---
        // We will check for 'manual' and 'scheduled' reminders.
        
        const in10Minutes = new Date(now.getTime() + 10 * 60 * 1000); 
        const in11Minutes = new Date(now.getTime() + 11 * 60 * 1000); 

        try {
            // Find reminders in the 10-11 minute window
            const remindersToNotify = await Reminder.find({
                status: 'pending',
                // UPDATED: Now includes 'manual' reminders
                reminderType: 'scheduled', 
                remindAt: {
                    $gte: in10Minutes, // >= 10 minutes from now
                    $lt: in11Minutes   // < 11 minutes from now
                }
            }).populate('userId', 'email username'); // Populate user data
            
            if (remindersToNotify.length > 0) {
                console.log(`[Scheduler] Found ${remindersToNotify.length} scheduled/manual reminder(s) to send.`);
            }

            for (const reminder of remindersToNotify) {
                await sendNotification(io, reminder.userId, reminder, "10-minute-warning");

                // Mark as dismissed so we don't send it again
                reminder.status = 'dismissed'; 
                await reminder.save();
            }

        } catch (error) {
            console.error("[Scheduler] Error handling scheduled/manual reminders:", error);
        }

        // --- BLOCK 2: Handle "At-Time" Triggers for Periodic Reminders ---
        // These trigger *exactly* when they are due (not 10 mins before).
        
        try {
            // Find all 'periodic' reminders that are still 'pending'
            const periodicReminders = await Reminder.find({
                status: 'pending',
                reminderType: { $in: ['periodic', 'manual'] }
            }).populate('userId', 'email username');

            if (periodicReminders.length > 0) {
                 console.log(`[Scheduler] Checking ${periodicReminders.length} periodic reminder(s).`);
            }

            for (const reminder of periodicReminders) {
                try {
                    // Check if this reminder is due *this exact minute*
                    const interval = parseExpression(reminder.cronRule, { currentDate: now });
                    const nextRun = interval.next().toDate();
                    
                    // Check if the next run time is *in the past* (meaning it just triggered)
                    // We check a 1-minute window to be safe.
                    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
                    
                    if (nextRun >= oneMinuteAgo && nextRun <= now) {
                        console.log(`[Scheduler] Triggering periodic reminder: ${reminder.title}`);
                        
                        // Send the "at-time" notification
                        await sendNotification(io, reminder.userId, reminder, "periodic-trigger");
                        
                        // NOTE: We DO NOT change the status for periodic reminders,
                        // because we want them to run again on their next cycle.
                        // If a user wants to stop them, they must delete the reminder.
                    }

                } catch (err) {
                    console.error(`Invalid cron rule for reminder ${reminder._id}: ${err.message}`);
                }
            }

        } catch (error) {
            console.error("[Scheduler] Error handling periodic reminders:", error);
        }
    });
}