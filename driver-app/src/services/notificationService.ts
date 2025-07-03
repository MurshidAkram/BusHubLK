export const sendNotification = async (notificationData) => {
    try {
        const response = await fetch('https://your-api-endpoint.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
        });

        if (!response.ok) {
            throw new Error('Failed to send notification');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};