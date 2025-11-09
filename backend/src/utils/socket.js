// This file will manage the mapping of which user is connected to which socket.
// This is a simple in-memory store. For production, you'd use Redis.
const userSocketMap = new Map(); // { userId: socketId }

export const initializeSocketIO = (io) => {

    // This runs every time a new user opens your website
    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // 1. Listen for the user to "register" themselves
        // The frontend will send this event with their userId after they log in
        socket.on('register', (userId) => {
            if (userId) {
                console.log(`User ${userId} registered with socket ${socket.id}`);
                userSocketMap.set(userId, socket.id);
                
                // You can also join them to a "room"
                // socket.join(userId);
            }
        });

        // 2. Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Find which user this socket belonged to and remove them
            for (let [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    break;
                }
            }
        });
    });
};

/**
 * Emits an event to a specific user if they are online.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} eventName - The name of the event (e.g., 'new_reminder').
 * @param {object} data - The payload to send (e.g., the reminder object).
 * @param {object} io - The main Socket.IO instance.
 */
export const emitToUser = (io, userId, eventName, data) => {
    const socketId = userSocketMap.get(userId.toString());
    if (socketId) {
        console.log(`Emitting event '${eventName}' to user ${userId} on socket ${socketId}`);
        io.to(socketId).emit(eventName, data);
        return true; // Notification sent
    }
    console.log(`User ${userId} is not connected. Cannot send in-app notification.`);
    return false; // User is offline
};