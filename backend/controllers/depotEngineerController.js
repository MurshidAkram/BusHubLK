const Bus = require('../models/busModel');
const User = require('../models/userModel');
const RegionDepot = require('../models/regionDepotModel');
const ServiceSchedule = require('../models/serviceScheduleModel');
const BusConditionReport = require('../models/BusConditionReport');
const BusDailyChecklist = require('../models/busDailyChecklistModel');

// Get buses for depot engineer (filtered by their depot)
const getBusesForDepotEngineer = async (req, res) => {
    try {
        // Use getRoleSpecificDetails instead of the non-existent getDepotEngineerDetails
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        // Get depot details to include region and depot names
        const depot = await RegionDepot.getDepotById(depotEngineerDetails.depot_id);

        if (!depot) {
            return res.status(404).json({
                success: false,
                message: 'Depot not found'
            });
        }

        const buses = await Bus.getByDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Buses retrieved successfully',
            buses,
            depot: {
                depot_id: depot.depot_id,
                depot_name: depot.depot_name,
                region_id: depot.region_id,
                region_name: depot.region_name
            }
        });
    } catch (err) {
        console.error('Get buses for depot engineer error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Update bus status (only status can be updated by depot engineer)
const ALLOWED_SEVERITY_VALUES = new Set(['low', 'medium', 'high']);

const formatDateAsISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const resolvePartPayload = (partsPayload = []) => {
    const partDefinitions = BusDailyChecklist.partDefinitions || [];
    const defaultState = new Map(partDefinitions.map((part) => [part.key, {
        key: part.key,
        label: part.label,
        hasIssue: false,
        notes: null,
        severity: null
    }]));

    if (!Array.isArray(partsPayload)) {
        return Array.from(defaultState.values());
    }

    partsPayload.forEach((raw) => {
        if (!raw) {
            return;
        }

        let key = typeof raw.key === 'string' ? raw.key.trim().toLowerCase() : typeof raw.partKey === 'string' ? raw.partKey.trim().toLowerCase() : '';

        if (key === 'turn_signals' || key === 'turnsignals' || key === 'signal_lights') {
            key = 'signallights';
        }

        if (key === 'lights' || key === 'head_lights' || key === 'head-light' || key === 'head-lighting') {
            key = 'headlights';
        }

        if (!defaultState.has(key)) {
            return;
        }

        const hasIssue = Boolean(raw.hasIssue ?? raw.issue ?? raw.isIssue);
        const notes = typeof raw.notes === 'string' && raw.notes.trim().length > 0
            ? raw.notes.trim()
            : typeof raw.description === 'string' && raw.description.trim().length > 0
                ? raw.description.trim()
                : null;

        let severity = null;
        if (hasIssue) {
            const severitySource = typeof raw.severity === 'string'
                ? raw.severity
                : typeof raw.level === 'string'
                    ? raw.level
                    : null;

            if (severitySource) {
                const normalised = severitySource.trim().toLowerCase();
                if (ALLOWED_SEVERITY_VALUES.has(normalised)) {
                    severity = normalised;
                }
            }
        }

        defaultState.set(key, {
            key,
            label: defaultState.get(key).label,
            hasIssue,
            notes: hasIssue ? notes : null,
            severity: hasIssue ? severity : null
        });
    });

    return Array.from(defaultState.values());
};

const updateBusStatus = async (req, res) => {
    const { bus_id } = req.params;
    const { status, part_checking_data } = req.body;

    try {
        // Use getRoleSpecificDetails here as well
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        const bus = await Bus.findById(bus_id);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        if (bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this bus'
            });
        }

        const updatedBus = await Bus.update(bus_id, { status });

        let checklistRecord = null;
        let automaticServiceSchedule = null;

        if (part_checking_data) {
            const { statusAfterCheck, parts } = part_checking_data;
            const resolvedParts = resolvePartPayload(parts);

            console.log('Resolved checklist parts payload:', resolvedParts);

            const missingDescriptions = resolvedParts.filter((part) => part.hasIssue && (!part.notes || part.notes.trim().length === 0));
            const missingSeverity = resolvedParts.filter((part) => part.hasIssue && (!part.severity || !ALLOWED_SEVERITY_VALUES.has(part.severity)));

            if (missingDescriptions.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Please provide issue descriptions for: ${missingDescriptions.map((part) => part.label).join(', ')}`
                });
            }

            if (missingSeverity.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Please select severity for: ${missingSeverity.map((part) => part.label).join(', ')}`
                });
            }

            checklistRecord = await BusDailyChecklist.upsertForToday({
                bus_id: Number(bus_id),
                checker_id: Number(req.user.userId),
                status_after_check: statusAfterCheck || status,
                parts: resolvedParts
            });

            let schedulingParts = resolvedParts.map((part) => ({
                key: part.key,
                label: part.label,
                hasIssue: part.hasIssue,
                notes: part.notes,
                severity: part.severity
            }));

            try {
                const todayDate = formatDateAsISO(new Date());
                const persistedChecklist = await BusDailyChecklist.getByBusAndDate(Number(bus_id), todayDate);

                if (persistedChecklist?.parts?.length) {
                    schedulingParts = persistedChecklist.parts.map((partRow) => ({
                        key: partRow.part_key || partRow.key,
                        label: partRow.part_label || partRow.label || partRow.part_key || partRow.key || 'Unknown Part',
                        hasIssue: Boolean(partRow.has_issue ?? partRow.hasIssue),
                        notes: partRow.notes ?? null,
                        severity: partRow.severity ? String(partRow.severity).trim().toLowerCase() : null
                    }));
                }
            } catch (persistErr) {
                console.warn('Unable to load persisted checklist parts, falling back to request payload:', persistErr);
            }

            const extractNoteDescription = (note) => {
                if (typeof note !== 'string') {
                    return '';
                }

                const trimmed = note.trim();

                if (!trimmed) {
                    return '';
                }

                const notesMatch = trimmed.match(/Notes?\s*:\s*(.+)$/i);
                if (notesMatch?.[1]) {
                    return notesMatch[1].trim();
                }

                return trimmed.replace(/^(?:low|medium|high)\s+severity\s+follow-up\s*:\s*/i, '').trim();
            };

            const highSeverityIssues = schedulingParts.filter((part) => part.hasIssue && part.severity === 'high');

            if (highSeverityIssues.length > 0 && bus.depot_id) {
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(0, 0, 0, 0);
                const nextDayDate = formatDateAsISO(nextDay);

                const noteSummaries = highSeverityIssues
                    .map((part) => {
                        const cleaned = extractNoteDescription(part.notes);
                        return cleaned.length > 0 ? cleaned : (typeof part.notes === 'string' ? part.notes.trim() : '');
                    })
                    .filter((note) => note.length > 0);

                const combinedNotes = noteSummaries.length > 0
                    ? noteSummaries.join('; ')
                    : 'High severity issue recorded.';

                const serviceType = combinedNotes.length > 240
                    ? `${combinedNotes.slice(0, 237)}...`
                    : combinedNotes;

                try {
                    const existingSchedule = await ServiceSchedule.findActiveByBusAndDate(bus.bus_id, nextDayDate);

                    if (existingSchedule) {
                        automaticServiceSchedule = {
                            created: false,
                            skipped: true,
                            schedule: existingSchedule,
                            reason: 'existing_schedule_for_date',
                            parts: highSeverityIssues.map((part) => part.label || part.key).filter(Boolean),
                            scheduled_date: nextDayDate
                        };
                    } else {
                        const createdSchedule = await ServiceSchedule.create({
                            service_type: serviceType,
                            bus_id: bus.bus_id,
                            scheduled_date: nextDayDate,
                            depot_id: bus.depot_id
                        });

                        const hydratedSchedule = createdSchedule?.id
                            ? await ServiceSchedule.findById(createdSchedule.id)
                            : null;

                        automaticServiceSchedule = {
                            created: true,
                            schedule: hydratedSchedule || createdSchedule,
                            reason: 'high_severity_issues',
                            parts: highSeverityIssues.map((part) => part.label || part.key).filter(Boolean),
                            scheduled_date: nextDayDate
                        };
                    }
                } catch (scheduleErr) {
                    console.error('Automatic service scheduling failed:', scheduleErr);
                    automaticServiceSchedule = {
                        created: false,
                        error: true,
                        reason: 'high_severity_issues',
                        parts: highSeverityIssues.map((part) => part.label || part.key).filter(Boolean),
                        scheduled_date: nextDayDate,
                        message: 'Automatic follow-up scheduling failed.',
                        errorDetails: scheduleErr.message
                    };
                }
            }
        }

        let message = 'Bus status updated successfully';
        if (automaticServiceSchedule?.created) {
            message += ' and follow-up service scheduled for tomorrow for recorded issues.';
        } else if (automaticServiceSchedule?.skipped) {
            message += ' (existing follow-up service detected for tomorrow).';
        } else if (automaticServiceSchedule?.error) {
            message += ' however automatic follow-up scheduling could not be completed.';
        }

        const responsePayload = {
            success: true,
            message,
            bus: updatedBus,
            checklist: checklistRecord
        };

        if (automaticServiceSchedule) {
            responsePayload.automatic_service_schedule = automaticServiceSchedule;
        }

        res.json(responsePayload);
    } catch (err) {
        console.error('Update bus status error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get service history for a specific bus limited to completed schedules
const getServiceHistoryForBus = async (req, res) => {
    try {
        const { bus_id } = req.params;

        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const bus = await Bus.findById(bus_id);

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        if (bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access service history for this bus'
            });
        }

        const schedules = await ServiceSchedule.getByBusId(bus_id);
        const enrichedSchedules = Array.isArray(schedules)
            ? schedules.map((schedule) => ({
                ...schedule,
                calculated_status: ServiceSchedule.calculateStatus(
                    schedule.scheduled_date,
                    schedule.status,
                    schedule.is_deleted
                )
            }))
            : [];

        res.json({
            success: true,
            message: 'Service history retrieved successfully',
            schedules: enrichedSchedules,
            count: enrichedSchedules.length,
            bus: {
                bus_id: bus.bus_id,
                registration_number: bus.registration_number,
                depot_id: bus.depot_id
            }
        });
    } catch (err) {
        console.error('Get service history error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const getConditionReports = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const reports = await BusConditionReport.findByDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Bus condition reports retrieved successfully',
            reports,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get condition reports for depot engineer error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const getConditionReportStats = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const stats = await BusConditionReport.getReviewStatsForDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Bus condition report statistics retrieved successfully',
            stats,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get condition report stats error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const reviewConditionReport = async (req, res) => {
    try {
        const { report_id } = req.params;

        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const report = await BusConditionReport.findById(report_id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const bus = await Bus.findById(report.bus_id);

        if (!bus || bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this report'
            });
        }

        const updatedReport = await BusConditionReport.reviewReport(report_id, {
            reviewedBy: req.user.userId,
            reviewStatus: 'reviewed'
        });

        res.json({
            success: true,
            message: 'Report marked as reviewed',
            report: updatedReport
        });
    } catch (err) {
        console.error('Review condition report error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const CHECKLIST_PART_DEFINITIONS = BusDailyChecklist.partDefinitions || [];
const CHECKLIST_PART_KEYS = CHECKLIST_PART_DEFINITIONS.map((part) => part.key);

const getDailyChecklistsWithIssues = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const checklists = await BusDailyChecklist.getByDepotId(depotEngineerDetails.depot_id);

        const latestChecklistByBus = new Map();
        for (const checklist of checklists) {
            const existing = latestChecklistByBus.get(checklist.bus_id);
            const checklistTime = checklist.check_date ? new Date(checklist.check_date).getTime() : 0;
            const existingTime = existing?.check_date ? new Date(existing.check_date).getTime() : 0;

            if (!existing || checklistTime >= existingTime) {
                latestChecklistByBus.set(checklist.bus_id, checklist);
            }
        }

        const issues = [];
        for (const checklist of latestChecklistByBus.values()) {
            let missedParts = [];
            let missedPartDetails = [];

            if (Array.isArray(checklist.parts) && checklist.parts.length > 0) {
                const partsWithIssues = checklist.parts.filter((part) => part.has_issue);
                missedParts = partsWithIssues.map((part) => part.part_label || part.part_key);
                missedPartDetails = partsWithIssues.map((part) => ({
                    key: part.part_key,
                    label: part.part_label,
                    notes: part.notes || null,
                    severity: part.severity || null
                }));
            } else {
                missedParts = CHECKLIST_PART_KEYS.filter((key) => !Array.isArray(checklist[key]) && !checklist[key]);
            }

            if (missedParts.length > 0) {
                issues.push({
                    ...checklist,
                    missed_parts: missedParts,
                    missed_part_details: missedPartDetails
                });
            }
        }

        issues.sort((a, b) => {
            const busA = a.registration_number || String(a.bus_id);
            const busB = b.registration_number || String(b.bus_id);
            return busA.localeCompare(busB);
        });

        return res.json({
            success: true,
            message: 'Daily checklist issues retrieved successfully',
            checklists: issues,
            count: issues.length
        });
    } catch (err) {
        console.error('Get daily checklist issues error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports = {
    getBusesForDepotEngineer,
    updateBusStatus,
    getServiceHistoryForBus,
    getConditionReports,
    getConditionReportStats,
    reviewConditionReport,
    getDailyChecklistsWithIssues
};