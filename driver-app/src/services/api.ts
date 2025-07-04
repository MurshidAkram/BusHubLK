export const submitLostAndFoundReport = async (reportData) => {
    const response = await fetch('/api/lost-and-found', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });
    return response.json();
};

export const submitEmergencyReport = async (reportData) => {
    const response = await fetch('/api/emergency-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });
    return response.json();
};

export const submitConditionReport = async (reportData) => {
    const response = await fetch('/api/condition-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });
    return response.json();
};

export const submitTravelLog = async (logData) => {
    const response = await fetch('/api/travel-log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
    });
    return response.json();
};