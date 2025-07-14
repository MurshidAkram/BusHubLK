export const validateRequiredField = (value: string): boolean => {
    return value.trim() !== '';
};

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Returns date in YYYY-MM-DD format
};

export const formatTime = (date: Date): string => {
    return date.toTimeString().split(' ')[0]; // Returns time in HH:MM:SS format
};

export const isValidLocation = (latitude: number, longitude: number): boolean => {
    return (
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
};