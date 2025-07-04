export interface LostAndFoundReport {
    itemDescription: string;
    location: string;
    photo: string; // URL or base64 string for the uploaded photo
}

export interface EmergencyReport {
    incidentType: string;
    description: string;
    location: string;
}

export interface ConditionReport {
    issueDescription: string;
}

export interface TravelLog {
    departureTime: Date;
    arrivalTime: Date;
}