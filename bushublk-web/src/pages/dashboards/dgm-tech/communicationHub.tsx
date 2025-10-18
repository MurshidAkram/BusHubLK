import { useState, useEffect, useRef, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, Plus, MessageSquare, AlertCircle, Megaphone, X, Check } from 'lucide-react';
import { AppContext } from '../../../context/AppContext';

const API_URL =import.meta.env.VITE_API_URL;

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
}

const ImprovedDGMCEOHub = () => {
  const context = useContext(AppContext) as AppContextType;
  const { token, user } = context;
  
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [announcementForm, setAnnouncementForm] = useState({
    targetType: 'region',
    targetIds: [],
    channelName: '',
    initialMessage: ''
  });

  const [selectedRegionsForAnnouncement, setSelectedRegionsForAnnouncement] = useState<number[]>([]);
  const [selectedDepotsForAnnouncement, setSelectedDepotsForAnnouncement] = useState<number[]>([]);

  const isDGMorCEO = ['dgm_technical', 'dgm_operations', 'ceo'].includes(user?.role || '');

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
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

    newSocket.on('new_message', ({ channelId, message }) => {
      // Always add message to current channel if it matches
      if (activeChannel?.channel_id === channelId) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
      
      // Update channels list with new message
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

    newSocket.on('user_typing', ({ userId, channelId }) => {
      if (activeChannel?.channel_id === channelId) {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      }
    });

    newSocket.on('user_stopped_typing', ({ userId }) => {
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
  }, [token]);

  useEffect(() => {
    if (token && isDGMorCEO) {
      fetchChannels();
      fetchRegions();
    }
  }, [token, isDGMorCEO]);

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
  }, [activeChannel?.channel_id, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communication/channels`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch(`${API_URL}/api/communication/regions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRegions(data.regions);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const fetchDepots = async (regionId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/communication/depots?regionId=${regionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/communication/channels/${channelId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const markChannelAsRead = async (channelId: string) => {
    try {
      await fetch(`${API_URL}/api/communication/channels/${channelId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
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
        // Immediately add message to UI
        const newMessage: Message = {
          message_id: data.message.message_id,
          sender_id: user?.id || '',
          sender_name: `${user?.first_name} ${user?.last_name}`,
          message_text: messageText.trim(),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        
        if (socket) {
          socket.emit('typing_stop', { channelId: activeChannel.channel_id });
        }
        
        setTimeout(scrollToBottom, 100);
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
    
    const targetIds = announcementForm.targetType === 'region' 
      ? selectedRegionsForAnnouncement 
      : selectedDepotsForAnnouncement;

    if (targetIds.length === 0 || !announcementForm.channelName || !announcementForm.initialMessage) {
      setError('Please fill in all fields and select at least one target');
      return;
    }

    try {
      // Send announcement to each selected target
      for (const targetId of targetIds) {
        await fetch(`${API_URL}/api/communication/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            targetType: announcementForm.targetType,
            targetId: targetId,
            channelName: announcementForm.channelName,
            initialMessage: announcementForm.initialMessage
          })
        });
      }

      setShowAnnouncement(false);
      setAnnouncementForm({
        targetType: 'region',
        targetIds: [],
        channelName: '',
        initialMessage: ''
      });
      setSelectedRegionsForAnnouncement([]);
      setSelectedDepotsForAnnouncement([]);
      setSelectedRegion(null);
      await fetchChannels();
      setError(null);
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError('Failed to create announcement');
    }
  };

  const handleTyping = () => {
    if (!socket || !activeChannel) return;
    socket.emit('typing_start', { channelId: activeChannel.channel_id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
      dgm_technical: 'bg-indigo-100 text-indigo-800',
      dgm_operations: 'bg-teal-100 text-teal-800',
      ceo: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleName = (role: string): string => {
    return role?.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || '';
  };

  const canSendInChannel = (channel: Channel): boolean => {
    if (channel.channel_type === 'announcement') {
      return channel.participants.some((p: ChannelParticipant) => p.user_id === user?.id);
    }
    return true;
  };

  const toggleRegionSelection = (regionId: number) => {
    setSelectedRegionsForAnnouncement(prev => 
      prev.includes(regionId) 
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  };

  const toggleDepotSelection = (depotId: number) => {
    setSelectedDepotsForAnnouncement(prev => 
      prev.includes(depotId) 
        ? prev.filter(id => id !== depotId)
        : [...prev, depotId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Messages
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {channels.filter(ch => ch.channel_type === 'direct').length} conversation{channels.filter(ch => ch.channel_type === 'direct').length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnnouncement(true)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                title="Create announcement"
              >
                <Megaphone className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setShowContacts(true)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                title="New conversation"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Direct Messages Section */}
          <div className="p-4 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Direct Messages</h3>
          </div>
          {channels.filter(ch => ch.channel_type === 'direct').length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="mb-3 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowContacts(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Start a conversation →
              </button>
            </div>
          ) : (
            channels.filter(ch => ch.channel_type === 'direct').map((channel) => (
              <button
                key={channel.channel_id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full p-4 text-left border-b border-gray-100 transition-all ${
                  activeChannel?.channel_id === channel.channel_id
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    {getChannelName(channel).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-900 truncate text-base">
                        {getChannelName(channel)}
                      </p>
                      {channel.unread_count > 0 && (
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          {channel.unread_count}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full inline-block mb-1 font-medium ${getRoleBadgeColor(getChannelRole(channel))}`}>
                      {formatRoleName(getChannelRole(channel))}
                    </span>
                    {channel.last_message && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {channel.last_message.message_text}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}

          {/* Announcements Section */}
          {channels.filter(ch => ch.channel_type === 'announcement').length > 0 && (
            <>
              <div className="p-4 bg-orange-50 border-t-2 border-orange-200 mt-4">
                <h3 className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Announcements Sent
                </h3>
              </div>
              {channels.filter(ch => ch.channel_type === 'announcement').map((channel) => (
                <button
                  key={channel.channel_id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full p-4 text-left border-b border-orange-100 transition-all ${
                    activeChannel?.channel_id === channel.channel_id
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-l-orange-600'
                      : 'hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
                      <Megaphone className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 truncate text-base">
                          {getChannelName(channel)}
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full inline-block mb-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 font-medium">
                        📢 Announcement
                      </span>
                      {channel.last_message && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {channel.last_message.message_text}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChannel ? (
          <>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ${
                  activeChannel.channel_type === 'announcement'
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  {activeChannel.channel_type === 'announcement' ? (
                    <Megaphone className="w-6 h-6" />
                  ) : (
                    getChannelName(activeChannel).charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{getChannelName(activeChannel)}</h3>
                  {activeChannel.channel_type === 'announcement' ? (
                    <p className="text-xs text-blue-100 font-medium">
                      📢 Announcement Channel • Read-only for recipients
                    </p>
                  ) : (
                    <p className="text-xs text-blue-100 font-medium">
                      {formatRoleName(getChannelRole(activeChannel))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-700">No messages yet</p>
                    <p className="text-sm text-gray-500">
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
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`max-w-xl ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <p className="text-xs text-gray-600 mb-1 ml-3 font-medium">
                            {message.sender_name}
                          </p>
                        )}
                        <div
                          className={`px-5 py-3 rounded-3xl shadow-md ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.message_text}
                          </p>
                          <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTimeAgo(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {canSendInChannel(activeChannel) ? (
              <div className="p-6 border-t border-gray-200 bg-white shadow-lg">
                {activeChannel.channel_type === 'announcement' ? (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                      <Megaphone className="w-5 h-5" />
                      <p className="font-semibold">Announcement Channel</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      This is a one-way announcement. Recipients cannot reply.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="flex gap-3">
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
                      placeholder="Type a message..."
                      className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
                    >
                      <Send className="w-5 h-5" />
                      Send
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">You can only view messages in this announcement channel</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <MessageSquare className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome, {user?.first_name}!
              </h3>
              <p className="text-gray-600 mb-6">Select a conversation or create a new one</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowContacts(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  New Chat
                </button>
                <button
                  onClick={() => setShowAnnouncement(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
                >
                  <Megaphone className="w-5 h-5" />
                  Announcement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContacts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  New Conversation
                </h3>
                <button
                  onClick={() => {
                    setShowContacts(false);
                    setSelectedRegion(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Region
              </label>
              <select
                value={selectedRegion || ''}
                onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region.region_id} value={region.region_id}>
                    {region.region_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] px-6 pb-6">
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-gray-700">No contacts available</p>
                  <p className="text-sm">Try selecting a region</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.user_id}
                      onClick={() => startNewChat(contact)}
                      className="w-full p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl text-left transition-all border-2 border-transparent hover:border-blue-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate text-lg">{contact.name}</p>
                          <p className={`text-xs px-3 py-1 rounded-full inline-block font-medium ${getRoleBadgeColor(contact.role)}`}>
                            {formatRoleName(contact.role)}
                          </p>
                          {contact.region_name && (
                            <p className="text-xs text-gray-500 mt-1">📍 {contact.region_name}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-7 h-7" />
                  Create Announcement
                </h3>
                <button
                  onClick={() => {
                    setShowAnnouncement(false);
                    setAnnouncementForm({
                      targetType: 'region',
                      targetIds: [],
                      channelName: '',
                      initialMessage: ''
                    });
                    setSelectedRegionsForAnnouncement([]);
                    setSelectedDepotsForAnnouncement([]);
                    setSelectedRegion(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={createAnnouncement} className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-6 space-y-6">
                {/* Target Type Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Broadcast To
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAnnouncementForm({ ...announcementForm, targetType: 'region' });
                        setSelectedDepotsForAnnouncement([]);
                        setSelectedRegion(null);
                      }}
                      className={`p-4 rounded-2xl font-bold transition-all ${
                        announcementForm.targetType === 'region'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🌍 Regions
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnnouncementForm({ ...announcementForm, targetType: 'depot' });
                        setSelectedRegionsForAnnouncement([]);
                      }}
                      className={`p-4 rounded-2xl font-bold transition-all ${
                        announcementForm.targetType === 'depot'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏢 Depots
                    </button>
                  </div>
                </div>

                {/* Region Selection */}
                {announcementForm.targetType === 'region' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Select Regions ({selectedRegionsForAnnouncement.length} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border-2 border-gray-200 rounded-2xl">
                      {regions.map(region => (
                        <button
                          key={region.region_id}
                          type="button"
                          onClick={() => toggleRegionSelection(region.region_id)}
                          className={`p-4 rounded-xl text-left transition-all border-2 ${
                            selectedRegionsForAnnouncement.includes(region.region_id)
                              ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-500 shadow-md'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{region.region_name}</span>
                            {selectedRegionsForAnnouncement.includes(region.region_id) && (
                              <Check className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Depot Selection */}
                {announcementForm.targetType === 'depot' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        First, Select a Region
                      </label>
                      <select
                        value={selectedRegion || ''}
                        onChange={(e) => {
                          setSelectedRegion(e.target.value ? Number(e.target.value) : null);
                          setSelectedDepotsForAnnouncement([]);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                      >
                        <option value="">Choose a region</option>
                        {regions.map(region => (
                          <option key={region.region_id} value={region.region_id}>
                            {region.region_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedRegion && depots.length > 0 && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Select Depots ({selectedDepotsForAnnouncement.length} selected)
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border-2 border-gray-200 rounded-2xl">
                          {depots.map(depot => (
                            <button
                              key={depot.depot_id}
                              type="button"
                              onClick={() => toggleDepotSelection(depot.depot_id)}
                              className={`p-4 rounded-xl text-left transition-all border-2 ${
                                selectedDepotsForAnnouncement.includes(depot.depot_id)
                                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-500 shadow-md'
                                  : 'bg-white border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">{depot.depot_name}</span>
                                {selectedDepotsForAnnouncement.includes(depot.depot_id) && (
                                  <Check className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Announcement Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    value={announcementForm.channelName}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, channelName: e.target.value })}
                    placeholder="e.g., Monthly Safety Update"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Announcement Message *
                  </label>
                  <textarea
                    value={announcementForm.initialMessage}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, initialMessage: e.target.value })}
                    placeholder="Enter your announcement message..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl hover:shadow-xl font-bold transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Megaphone className="w-6 h-6" />
                  Send Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-md">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImprovedDGMCEOHub;