/**
 * ConversationView Component
 * 
 * Displays conversation history for a client with messages in chronological order.
 * Supports filtering by channel and searching messages.
 */

'use client';

import { useState, useMemo } from 'react';
import { useClientMessages, useClientConversations } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Message, CommunicationChannel } from '@/types/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Search, MessageSquare, Bot, User, Phone, Mail } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface ConversationViewProps {
  clientId: string;
}

// CHANNEL_ICONS is defined at module level so it can be used in MessageBubble
const CHANNEL_ICONS: Record<CommunicationChannel, React.ReactNode> = {
  WHATSAPP: <Phone className="h-4 w-4" />,
  TELEGRAM: <MessageSquare className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
};

export default function ConversationView({ clientId }: ConversationViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [messagesLimit] = useState(50);

  // Create CHANNEL_LABELS dynamically using translations
  const CHANNEL_LABELS = useMemo<Record<CommunicationChannel, string>>(() => {
    return {
      WHATSAPP: 'WhatsApp',
      TELEGRAM: 'Telegram',
      EMAIL: 'Email',
    };
  }, []);

  // Fetch conversations to get channel info
  const { data: conversationsData, isLoading: conversationsLoading } = useClientConversations(clientId);

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useClientMessages(clientId, {
    limit: messagesLimit,
    offset: 0,
    search: searchQuery || undefined,
  });

  // Filter messages by channel if selected
  const filteredMessages = useMemo(() => {
    if (!messagesData?.data) return [];

    let messages = messagesData.data;

    // Filter by channel
    if (selectedChannel !== 'ALL') {
      messages = messages.filter((msg) => msg.conversation.channel === selectedChannel);
    }

    // Sort by date (oldest first for conversation view)
    return [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesData, selectedChannel]);

  // Get unique channels from conversations
  const availableChannels = useMemo(() => {
    if (!conversationsData?.data) return [];
    const channels = new Set<CommunicationChannel>();
    conversationsData.data.forEach((conv) => {
      channels.add(conv.channel);
    });
    return Array.from(channels);
  }, [conversationsData]);

  const isLoading = conversationsLoading || messagesLoading;
  const hasMessages = filteredMessages.length > 0;
  const totalMessages = messagesData?.pagination.total || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('conversations.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Channel Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedChannel === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel('ALL')}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t('conversations.allChannels')}</span>
                <span className="sm:hidden">{t('common.all')}</span>
              </Button>
              {availableChannels.map((channel) => (
                <Button
                  key={channel}
                  variant={selectedChannel === channel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChannel(channel)}
                  className="text-xs sm:text-sm"
                >
                  {CHANNEL_ICONS[channel]}
                  <span className="ml-1 sm:ml-2 hidden sm:inline">{CHANNEL_LABELS[channel]}</span>
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none z-10" />
                <input
                  type="text"
                  id="message-search"
                  placeholder={t('conversations.searchMessages')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-300 ease-spring hover:border-primary/30 hover:bg-background/80"
                />
              </div>
            </div>
          </div>

          {/* Messages List */}
          {hasMessages ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm text-text-tertiary">
                {t('conversations.showingMessages', { count: filteredMessages.length, total: totalMessages })}
              </div>
              <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                {filteredMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} channelLabels={CHANNEL_LABELS} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-tertiary">
              {searchQuery || selectedChannel !== 'ALL' ? (
                <p>{t('common.noResults')}</p>
              ) : (
                <div className="space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-text-tertiary opacity-50" />
                  <p>{t('conversations.noMessagesDescription')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: Message;
  channelLabels: Record<CommunicationChannel, string>;
}

function MessageBubble({ message, channelLabels }: MessageBubbleProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isIncoming = message.direction === 'INCOMING';
  const isFromClient = message.sender === 'CLIENT';
  const isFromAI = message.sender === 'AI';
  const isFromHuman = message.sender === 'HUMAN';

  const senderLabel = isFromClient
    ? t('conversations.client')
    : isFromAI
    ? t('conversations.aiAgent')
    : isFromHuman && message.senderUser
    ? `${message.senderUser.firstName || ''} ${message.senderUser.lastName || ''}`.trim() || t('conversations.operator')
    : t('conversations.operator');

  const channelIcon = CHANNEL_ICONS[message.conversation.channel];
  const channelLabel = channelLabels?.[message.conversation.channel] || message.conversation.channel;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 sm:p-4 rounded-lg border',
        isIncoming
          ? 'bg-surface border-border'
          : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
      )}
    >
      {/* Message Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary flex-wrap">
          {isFromAI ? (
            <Bot className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          ) : isFromHuman ? (
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          ) : (
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          )}
          <span className="font-medium">{senderLabel}</span>
          <span className="text-text-tertiary hidden sm:inline">{t('conversations.to')}</span>
          <div className="flex items-center gap-1 text-text-tertiary">
            {channelIcon}
            <span className="hidden sm:inline">{channelLabel}</span>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-text-tertiary">
          {formatDate(message.createdAt, locale)}
        </div>
      </div>

      {/* Message Content */}
      <div className="text-sm sm:text-base text-text-primary whitespace-pre-wrap break-words">
        {message.content}
      </div>

      {/* Translation (if available) */}
      {message.translatedContent && message.translatedContent !== message.content && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="text-xs text-text-tertiary mb-1">
            {t('conversations.translation', { language: message.language || 'auto' })}
          </div>
          <div className="text-xs sm:text-sm text-text-secondary italic">
            {message.translatedContent}
          </div>
        </div>
      )}

      {/* Message Status */}
      {message.status && message.status !== 'SENT' && (
        <div className="text-xs text-text-tertiary">
          {t('conversations.messageStatus', { status: message.status })}
        </div>
      )}
    </div>
  );
}

