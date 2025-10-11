import React, { useState, useEffect, useRef, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppContext } from '../../../context/AppContext';
import { Send, Users, Plus, MessageSquare, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000';

// Type definitions
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  avatar?: string;
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
}

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const CommunicationHub = () => {
  const context = useContext(AppContext);
  const { token, user } = context as AppContextType;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to real-time messaging');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, activeChannel]);

  useEffect(() => {
    if (token) {
      fetchChannels();
    }
  }, [token]);

  useEffect(() => {
    if (showContacts && contacts.length === 0) {
      fetchContacts();
    }
  }, [showContacts]);

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

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communication/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
        // Use the channel data returned from the API directly
        setActiveChannel(data.channel);
        await fetchChannels(); // Update the channels list
        setShowContacts(false);
      }
    } catch (err) {
      console.error('Error creating channel:', err);
      setError('Failed to start conversation');
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
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleName = (role: string): string => {
    return role?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || '';
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
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </h2>
            <button
              onClick={() => setShowContacts(!showContacts)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {channels.length} conversation{channels.length !== 1 ? 's' : ''}
          </p>
        </div>

        {showContacts && (
          <div className="absolute top-0 left-0 w-80 h-full bg-white z-10 shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">New Conversation</h3>
                <button
                  onClick={() => setShowContacts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)]">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No contacts available</p>
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
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {getChannelName(channel).charAt(0)}
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
                    <p className={`text-xs px-2 py-0.5 rounded-full inline-block mb-1 ${getRoleBadgeColor(getChannelRole(channel))}`}>
                      {formatRoleName(getChannelRole(channel))}
                    </p>
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

      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getChannelName(activeChannel).charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getChannelName(activeChannel)}</h3>
                  <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(getChannelRole(activeChannel))}`}>
                    {formatRoleName(getChannelRole(activeChannel))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
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

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p>Choose a conversation from the list or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunicationHub;