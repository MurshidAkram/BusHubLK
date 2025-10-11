import React, { useState, useEffect, useRef, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, Plus, MessageSquare, AlertCircle, Megaphone, Filter, X, ChevronDown } from 'lucide-react';
import { AppContext } from '../../../context/AppContext';

const API_URL = 'http://localhost:5000';

// Type definitions
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  depot_id?: number;
  region_id?: number;
}

interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
}

interface ChannelParticipant {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Channel {
  channel_id: string;
  channel_type: string;
  channel_name?: string;
  participants: ChannelParticipant[];
  last_message?: {
    message_text: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
}

interface Contact {
  user_id: string;
  name: string;
  role: string;
  region_id?: number;
  region_name?: string;
}

interface Region {
  region_id: number;
  region_name: string;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  region_id: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Import actual AppContext - adjust path as needed
// const AppContext = React.createContext<AppContextType>(...);
// Remove the mock and use your actual AppContext import

const DGMCommunicationHub = () => {
  const context = useContext(AppContext);
  const { token, user } = context as AppContextType;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    targetType: 'region' as 'region' | 'depot',
    targetId: '',
    channelName: '',
    initialMessage: ''
  });

const isDGM = user?.role === 'dgm_technical' || user?.role === 'dgm_operations' || user?.role === 'ceo';

  // Debug logging
  useEffect(() => {
    console.log('=== DGM Communication Hub Debug ===');
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('User role:', user?.role);
    console.log('Is DGM:', isDGM);
    console.log('Token exists:', !!token);
    console.log('Token preview:', token?.substring(0, 30) + '...');
    console.log('================================');
  }, [user, token]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join_channels');
    });

    newSocket.on('new_message', ({ channelId, message }: { channelId: string; message: Message }) => {
      if (activeChannel?.channel_id === channelId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      setChannels(prev => prev.map(ch => {
        if (ch.channel_id === channelId) {
          return {
            ...ch,
            last_message: {
              message_text: message.message_text,
              sender_name: message.sender_name,
              created_at: message.created_at
            },
            unread_count: ch.channel_id !== activeChannel?.channel_id ? ch.unread_count + 1 : 0
          };
        }
        return ch;
      }));
    });

    newSocket.on('user_typing', ({ userId, channelId }: { userId: string; channelId: string }) => {
      if (activeChannel?.channel_id === channelId) {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      }
    });

    newSocket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, activeChannel]);

  useEffect(() => {
    if (token && isDGM) {
      fetchChannels();
      fetchRegions();
    } else if (token && !isDGM) {
      console.warn('User is not DGM, region features disabled');
      fetchChannels();
    }
  }, [token, isDGM]);

  useEffect(() => {
    if (announcementForm.targetType === 'depot' && selectedRegion) {
      fetchDepots(selectedRegion);
    }
  }, [announcementForm.targetType, selectedRegion]);

  useEffect(() => {
    if (showContacts && selectedRegion !== null) {
      fetchContacts(selectedRegion);
    }
  }, [showContacts, selectedRegion]);

  useEffect(() => {
    if (activeChannel && token) {
      fetchMessages(activeChannel.channel_id);
      if (socket) {
        socket.emit('join_channel', activeChannel.channel_id);
      }
      markChannelAsRead(activeChannel.channel_id);
    }
  }, [activeChannel, token, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communication/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      console.log('Fetching regions with token:', token?.substring(0, 20) + '...');
      console.log('User role:', user?.role);
      
      const response = await fetch(`${API_URL}/api/communication/regions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Regions response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch regions:', response.status, errorText);
        
        if (response.status === 403) {
          setError('Access denied. Please check your permissions.');
        } else if (response.status === 401) {
          setError('Session expired. Please login again.');
        }
        return;
      }
      
      const data = await response.json();
      console.log('Regions data:', data);
      
      if (data.success) {
        setRegions(data.regions);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions');
    }
  };

  const fetchDepots = async (regionId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/communication/depots?regionId=${regionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch depots:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setDepots(data.depots);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
    }
  };

  const fetchContacts = async (regionId: number | null) => {
    try {
      const url = regionId 
        ? `${API_URL}/api/communication/contacts?regionId=${regionId}`
        : `${API_URL}/api/communication/contacts`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch contacts:', response.status);
        setError('Failed to load contacts');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/communication/channels/${channelId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  };

  const markChannelAsRead = async (channelId: string) => {
    try {
      await fetch(`${API_URL}/api/communication/channels/${channelId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setChannels(prev => prev.map(ch => 
        ch.channel_id === channelId ? { ...ch, unread_count: 0 } : ch
      ));
    } catch (err) {
      console.error('Error marking channel as read:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChannel) return;

    try {
      const response = await fetch(`${API_URL}/api/communication/channels/${activeChannel.channel_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageText: messageText.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setMessageText('');
        if (socket) {
          socket.emit('typing_stop', { channelId: activeChannel.channel_id });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const startNewChat = async (contact: Contact) => {
    try {
      const response = await fetch(`${API_URL}/api/communication/channels/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contactId: contact.user_id })
      });

      const data = await response.json();
      if (data.success) {
        setActiveChannel(data.channel);
        await fetchChannels();
        setShowContacts(false);
        setSelectedRegion(null);
      }
    } catch (err) {
      console.error('Error creating channel:', err);
      setError('Failed to start conversation');
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcementForm.targetId || !announcementForm.channelName || !announcementForm.initialMessage) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/communication/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementForm)
      });

      const data = await response.json();
      if (data.success) {
        setShowAnnouncement(false);
        setAnnouncementForm({
          targetType: 'region',
          targetId: '',
          channelName: '',
          initialMessage: ''
        });
        setSelectedRegion(null);
        await fetchChannels();
        setActiveChannel(data.channel);
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError('Failed to create announcement');
    }
  };

  const handleTyping = () => {
    if (!socket || !activeChannel) return;

    socket.emit('typing_start', { channelId: activeChannel.channel_id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { channelId: activeChannel.channel_id });
    }, 1000);
  };

  const getChannelName = (channel: Channel): string => {
    if (channel.channel_name) return channel.channel_name;
    
    const otherParticipant = channel.participants?.[0];
    if (otherParticipant) {
      return `${otherParticipant.first_name} ${otherParticipant.last_name}`;
    }
    
    return 'Unknown';
  };

  const getChannelRole = (channel: Channel): string => {
    const otherParticipant = channel.participants?.[0];
    return otherParticipant?.role || '';
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
      depot_manager: 'bg-purple-100 text-purple-800',
      depot_operations: 'bg-blue-100 text-blue-800',
      depot_engineer: 'bg-green-100 text-green-800',
      regional_tech: 'bg-orange-100 text-orange-800',
      regional_operations: 'bg-cyan-100 text-cyan-800',
      ceo: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleName = (role: string): string => {
    return role?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || '';
  };

  const canSendInChannel = (channel: Channel): boolean => {
    if (channel.channel_type === 'announcement') {
      return channel.participants.some(p => p.user_id === user?.id);
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnnouncement(!showAnnouncement)}
                className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                title="Create announcement"
              >
                <Megaphone className="w-5 h-5 text-orange-600" />
              </button>
              <button
                onClick={() => setShowContacts(!showContacts)}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="New conversation"
              >
                <Plus className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {channels.length} conversation{channels.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* New Contact Panel */}
        {showContacts && (
          <div className="absolute top-0 left-0 w-80 h-full bg-white z-10 shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">New Conversation</h3>
                <button
                  onClick={() => {
                    setShowContacts(false);
                    setSelectedRegion(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Region Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Region
                </label>
                <div className="relative">
                  <select
                    value={selectedRegion || ''}
                    onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region.region_id} value={region.region_id}>
                        {region.region_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-10rem)]">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No contacts available</p>
                  <p className="text-sm">Try selecting a region</p>
                </div>
              ) : (
                <div className="p-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.user_id}
                      onClick={() => startNewChat(contact)}
                      className="w-full p-3 hover:bg-gray-50 rounded-lg text-left transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                          <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(contact.role)}`}>
                            {formatRoleName(contact.role)}
                          </p>
                          {contact.region_name && (
                            <p className="text-xs text-gray-500 mt-1">{contact.region_name}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcement Panel */}
        {showAnnouncement && (
          <div className="absolute top-0 left-0 w-80 h-full bg-white z-10 shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-600" />
                  New Announcement
                </h3>
                <button
                  onClick={() => {
                    setShowAnnouncement(false);
                    setAnnouncementForm({
                      targetType: 'region',
                      targetId: '',
                      channelName: '',
                      initialMessage: ''
                    });
                    setSelectedRegion(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={createAnnouncement} className="p-4 space-y-4 overflow-y-auto h-[calc(100%-5rem)]">
              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broadcast To
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementForm({ ...announcementForm, targetType: 'region', targetId: '' });
                      setSelectedRegion(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      announcementForm.targetType === 'region'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Region
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementForm({ ...announcementForm, targetType: 'depot', targetId: '' });
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      announcementForm.targetType === 'depot'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Depot
                  </button>
                </div>
              </div>

              {/* Region Selection */}
              {announcementForm.targetType === 'region' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Region *
                  </label>
                  <div className="relative">
                    <select
                      value={announcementForm.targetId}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                      required
                    >
                      <option value="">Choose a region</option>
                      {regions.map(region => (
                        <option key={region.region_id} value={region.region_id}>
                          {region.region_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Depot Selection */}
              {announcementForm.targetType === 'depot' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Region First *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRegion || ''}
                        onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                        required
                      >
                        <option value="">Choose a region</option>
                        {regions.map(region => (
                          <option key={region.region_id} value={region.region_id}>
                            {region.region_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {selectedRegion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Depot *
                      </label>
                      <div className="relative">
                        <select
                          value={announcementForm.targetId}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                          required
                        >
                          <option value="">Choose a depot</option>
                          {depots.map(depot => (
                            <option key={depot.depot_id} value={depot.depot_id}>
                              {depot.depot_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={announcementForm.channelName}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, channelName: e.target.value })}
                  placeholder="e.g., Monthly Safety Update"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Initial Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={announcementForm.initialMessage}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, initialMessage: e.target.value })}
                  placeholder="Enter your announcement message..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Megaphone className="w-5 h-5" />
                Send Announcement
              </button>
            </form>
          </div>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="mb-2">No conversations yet</p>
              <button
                onClick={() => setShowContacts(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.channel_id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full p-4 text-left border-b border-gray-200 transition-colors ${
                  activeChannel?.channel_id === channel.channel_id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                    channel.channel_type === 'announcement'
                      ? 'bg-gradient-to-br from-orange-500 to-red-600'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {channel.channel_type === 'announcement' ? (
                      <Megaphone className="w-6 h-6" />
                    ) : (
                      getChannelName(channel).charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {getChannelName(channel)}
                      </p>
                      {channel.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {channel.unread_count}
                        </span>
                      )}
                    </div>
                    {channel.channel_type === 'announcement' ? (
                      <p className="text-xs px-2 py-0.5 rounded-full inline-block mb-1 bg-orange-100 text-orange-800">
                        Announcement
                      </p>
                    ) : (
                      <p className={`text-xs px-2 py-0.5 rounded-full inline-block mb-1 ${getRoleBadgeColor(getChannelRole(channel))}`}>
                        {formatRoleName(getChannelRole(channel))}
                      </p>
                    )}
                    {channel.last_message && (
                      <p className="text-sm text-gray-600 truncate">
                        {channel.last_message.message_text}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  activeChannel.channel_type === 'announcement'
                    ? 'bg-gradient-to-br from-orange-500 to-red-600'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {activeChannel.channel_type === 'announcement' ? (
                    <Megaphone className="w-5 h-5" />
                  ) : (
                    getChannelName(activeChannel).charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getChannelName(activeChannel)}</h3>
                  {activeChannel.channel_type === 'announcement' ? (
                    <p className="text-xs px-2 py-0.5 rounded-full inline-block bg-orange-100 text-orange-800">
                      Announcement • Read-only for recipients
                    </p>
                  ) : (
                    <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(getChannelRole(activeChannel))}`}>
                      {formatRoleName(getChannelRole(activeChannel))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p>No messages yet</p>
                    <p className="text-sm">
                      {activeChannel.channel_type === 'announcement' 
                        ? 'Send your first announcement'
                        : 'Start the conversation!'}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.message_id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <p className="text-xs text-gray-600 mb-1 ml-2">
                            {message.sender_name}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm shadow'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message_text}
                          </p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTimeAgo(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {canSendInChannel(activeChannel) ? (
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder={activeChannel.channel_type === 'announcement' ? 'Send announcement...' : 'Type a message...'}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">You can only view messages in this announcement channel</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome, {user?.first_name}
              </h3>
              <p className="mb-4">Select a conversation or create a new one</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowContacts(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
                <button
                  onClick={() => setShowAnnouncement(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  Announcement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DGMCommunicationHub;