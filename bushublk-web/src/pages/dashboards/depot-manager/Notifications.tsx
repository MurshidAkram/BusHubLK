import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { HiOutlineBell, HiOutlineShieldExclamation, HiOutlineCheckCircle } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

type NotificationSourceType =
	| 'emergency_report'
	| 'manager_chat'
	| 'rto_manager_chat'
	| 'announcement'
	| 'direct_message';

type DepotManagerNotification = {
	source_type: NotificationSourceType;
	source_id: number;
	created_at: string;
	title: string;
	message: string;
	status: string;
	bus_id: number | null;
	registration_number: string | null;
	driver_id: number | null;
	depot_id: number | null;
	region_id: number | null;
	priority: string;
	meta?: Record<string, unknown> | null;
	read_at: string | null;
	is_read: boolean;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const PRIORITY_BADGE: Record<string, string> = {
	critical: 'bg-red-100 text-red-800',
	high: 'bg-orange-100 text-orange-800',
	medium: 'bg-blue-100 text-blue-800',
	low: 'bg-gray-100 text-gray-600'
};

const SOURCE_LABEL: Record<NotificationSourceType, string> = {
	emergency_report: 'Emergency Escalation',
	manager_chat: 'Depot Engineer Chat',
	rto_manager_chat: 'RTO Chat',
	announcement: 'Announcement',
	direct_message: 'Direct Message'
};

const Notifications: React.FC = () => {
	const appContext = useContext(AppContext);
	const token = appContext?.token || null;
	const user = appContext?.user;
	const [notifications, setNotifications] = useState<DepotManagerNotification[]>([]);
	const [state, setState] = useState<FetchState>('idle');
	const [error, setError] = useState<string | null>(null);

	const filteredNotifications = useMemo(
		() => notifications.filter((notification) => !notification.is_read),
		[notifications]
	);

	const refreshGlobalCount = () => {
		if (typeof window !== 'undefined' && typeof window.refreshNotificationCount === 'function') {
			window.refreshNotificationCount();
		}
	};

	const formatDate = (value: string) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return value;
		}
		return date.toLocaleString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const fetchNotifications = useCallback(async () => {
		if (!token) return;

		setState('loading');
		setError(null);

		try {
			const response = await axios.get('http://localhost:5000/api/depot-manager/notifications', {
				headers: {
					Authorization: `Bearer ${token}`
				},
				params: {
					limit: 200,
					includeRead: false
				}
			});

			if (response.data?.success) {
				setNotifications(response.data.notifications || []);
				setState('success');
			} else {
				setState('error');
				setError(response.data?.message || 'Failed to fetch notifications');
			}
		} catch (err) {
			const axiosErr = err as AxiosError<{ message?: string }>;
			setError(axiosErr.response?.data?.message || axiosErr.message);
			setState('error');
		}
	}, [token]);

	const markAsRead = async (notification: DepotManagerNotification) => {
		if (!token || notification.is_read) return;

		try {
			const response = await axios.post(
				'http://localhost:5000/api/depot-manager/notifications/mark-read',
				{
					sourceType: notification.source_type,
					sourceId: notification.source_id
				},
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (response.data?.success) {
				setNotifications((prev) =>
					prev.filter(
						(item) => !(item.source_type === notification.source_type && item.source_id === notification.source_id)
					)
				);
				refreshGlobalCount();
			}
		} catch (err) {
			console.error('Failed to mark depot manager notification as read:', err);
		}
	};

	const markAllAsRead = async () => {
		if (!token) return;

		try {
			const response = await axios.post(
				'http://localhost:5000/api/depot-manager/notifications/mark-all-read',
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (response.data?.success) {
				setNotifications([]);
				refreshGlobalCount();
			}
		} catch (err) {
			console.error('Failed to mark all depot manager notifications as read:', err);
		}
	};

	useEffect(() => {
		if (!token) {
			setError('Please log in to view notifications.');
			setState('error');
			return;
		}

		if (user?.role !== 'depot_manager') {
			setError('Notifications are only available for depot managers.');
			setState('error');
			return;
		}

		fetchNotifications();
	}, [token, user?.role, fetchNotifications]);

	const unreadCount = useMemo(() => filteredNotifications.length, [filteredNotifications]);

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
							<HiOutlineBell className="text-blue-600" />
							Depot Manager Notifications
						</h1>
						<p className="text-sm text-gray-600">
							Escalations, announcements, and priority updates requiring your attention
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<div className="bg-white border border-gray-200 rounded-full px-4 py-1 text-sm text-gray-600">
							Unread: <span className="font-semibold text-blue-600">{unreadCount}</span>
						</div>
						<button
							onClick={markAllAsRead}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
						>
							<HiOutlineCheckCircle />
							Mark All as Read
						</button>
					</div>
				</div>

				{state === 'loading' && (
					<div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
						Loading notifications…
					</div>
				)}

				{state === 'error' && (
					<div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-3">
						<HiOutlineShieldExclamation className="text-red-500 mt-1" size={20} />
						<div>
							<p className="font-medium">Unable to load notifications.</p>
							<p className="text-sm">{error}</p>
						</div>
					</div>
				)}

				{state === 'success' && filteredNotifications.length === 0 && (
					<div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
						<HiOutlineBell className="mx-auto text-3xl mb-2 text-gray-400" />
						<p className="font-medium">No notifications to display.</p>
						<p className="text-sm">All caught up! Check back later for new updates.</p>
					</div>
				)}

				{state === 'success' && filteredNotifications.length > 0 && (
					<div className="space-y-4">
						{filteredNotifications.map((notification) => (
							<article
								key={`${notification.source_type}-${notification.source_id}`}
								className={`bg-white rounded-lg border ${
									notification.is_read ? 'border-gray-200' : 'border-blue-200'
								} shadow-sm p-5 transition-all`}
							>
								<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<span
												className={`px-2 py-1 rounded-full text-xs font-semibold ${
													PRIORITY_BADGE[notification.priority] || PRIORITY_BADGE.medium
												}`}
											>
												{notification.priority.toUpperCase()}
											</span>
											<span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
												{SOURCE_LABEL[notification.source_type] || notification.source_type}
											</span>
											{!notification.is_read && (
												<span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
													New
												</span>
											)}
										</div>
										<h2 className="text-lg font-semibold text-gray-900">{notification.title}</h2>
										<p className="text-sm text-gray-700 whitespace-pre-line">{notification.message}</p>
										<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
											<span>Received: {formatDate(notification.created_at)}</span>
											{notification.registration_number && <span>Bus: {notification.registration_number}</span>}
											{notification.status && <span>Status: {notification.status}</span>}
										</div>
									</div>
									<div className="flex items-center gap-2 md:flex-col md:items-end">
										<button
											onClick={() => markAsRead(notification)}
											disabled={notification.is_read}
											className={`px-4 py-2 rounded-md text-sm font-medium ${
												notification.is_read
													? 'bg-gray-100 text-gray-500 cursor-not-allowed'
													: 'bg-blue-600 text-white hover:bg-blue-700'
											}`}
										>
											{notification.is_read ? 'Read' : 'Mark as Read'}
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Notifications;
