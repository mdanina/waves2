/**
 * Страница сообщений клиента
 * Мессенджер для общения с назначенными специалистами
 */

import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
  Stethoscope,
  Shield,
  Bell,
  BellOff,
  Paperclip,
  Headphones,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/contexts/AuthContext';
import {
  Message,
  Conversation,
  AttachmentInfo,
  SplitConversations,
  SUPPORT_VIRTUAL_ID,
  DEFAULT_PAGE_SIZE,
  getClientSplitConversations,
  getMessages,
  getSupportMessages,
  sendMessage,
  sendSupportMessage,
  uploadAttachment,
  markMessagesAsRead,
  markSupportMessagesAsRead,
  subscribeToMessages,
  enrichMessageWithSignedUrl,
} from '@/lib/supabase-messages';
import { formatMessageTime, getInitials, debounce } from '@/lib/utils';
import { MessageAttachment, AttachmentPreview } from '@/components/chat/MessageAttachment';

export default function ClientMessages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { permission, requestPermission, notifyNewMessage } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMessagesRequestId = useRef(0); // Для предотвращения race condition
  const selectedConversationRef = useRef<Conversation | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  // Разделённые беседы: поддержка и специалисты
  const [splitConversations, setSplitConversations] = useState<SplitConversations>({
    support: [],
    specialists: [],
    hasNewSupportOption: false,
    specialistsTotalCount: 0,
    specialistsPage: 1,
    specialistsPageSize: DEFAULT_PAGE_SIZE,
    specialistsTotalPages: 0,
  });

  // Пагинация специалистов
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingSupport, setIsCreatingSupport] = useState(false);
  // Активная вкладка: 'specialists' или 'support'
  const [activeTab, setActiveTab] = useState<'specialists' | 'support'>('support');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Определяем мобильный вид
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Скролл к последнему сообщению (определяем ДО использования в useEffect)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Загрузка бесед (определяем ДО использования в useEffect)
  const loadConversations = useCallback(async (page: number = 1, showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const split = await getClientSplitConversations({ page, pageSize: DEFAULT_PAGE_SIZE });
      setSplitConversations(split);
      setCurrentPage(split.specialistsPage);
      setTotalPages(split.specialistsTotalPages);
      setTotalCount(split.specialistsTotalCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить беседы',
        variant: 'destructive',
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  // Загрузка бесед при монтировании
  useEffect(() => {
    if (user?.id) {
      loadConversations(1, true);
    }
  }, [user?.id, loadConversations]);

  // Обработчики пагинации специалистов
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      loadConversations(currentPage - 1, false);
    }
  }, [currentPage, loadConversations]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadConversations(currentPage + 1, false);
    }
  }, [currentPage, totalPages, loadConversations]);

  // Debounced функция для синхронизации счётчиков с сервером
  // Вызывается через 2 сек после последнего realtime сообщения
  const debouncedSyncCounters = useMemo(
    () => debounce(() => {
      loadConversations(currentPage, false);
    }, 2000),
    [loadConversations, currentPage]
  );

  // Синхронизация счётчиков при фокусе на окно
  // Решает проблему рассинхронизации между вкладками
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        debouncedSyncCounters();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, debouncedSyncCounters]);

  // Синхронизируем ref с состоянием для использования в callback подписки
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Все беседы для поиска в realtime callback
  const allConversations = useMemo(() =>
    [...splitConversations.support, ...splitConversations.specialists],
    [splitConversations]
  );

  useEffect(() => {
    conversationsRef.current = allConversations;
  }, [allConversations]);

  // Хелпер для обновления беседы в splitConversations
  const updateConversationInSplit = useCallback((
    recipientId: string,
    updater: (conv: Conversation) => Conversation
  ) => {
    setSplitConversations(prev => ({
      ...prev,
      support: prev.support.map(conv =>
        conv.recipientId === recipientId ? updater(conv) : conv
      ),
      specialists: prev.specialists.map(conv =>
        conv.recipientId === recipientId ? updater(conv) : conv
      ),
    }));
  }, []);

  // Подписка на новые сообщения
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToMessages(user.id, async (newMsg) => {
      try {
        const senderId = newMsg.sender_id;
        const currentConversation = selectedConversationRef.current;
        const isSupportMessage = newMsg.is_support_message === true;

        // Обогащаем сообщение signed URL если есть вложение
        const enrichedMsg = await enrichMessageWithSignedUrl(newMsg);

        // Проверяем, что текущая беседа не изменилась после async операции
        const stillSameConversation = selectedConversationRef.current?.recipientId === currentConversation?.recipientId;

        // Определяем ID беседы для обновления
        // Для сообщений поддержки используем виртуальный ID
        const conversationId = isSupportMessage ? SUPPORT_VIRTUAL_ID : senderId;

        // Проверяем, открыт ли чат с этой беседой
        const isChatOpen = currentConversation && stillSameConversation &&
          (currentConversation.recipientId === conversationId ||
           (isSupportMessage && currentConversation.recipientId === SUPPORT_VIRTUAL_ID));

        if (isChatOpen) {
          setMessages(prev => [...prev, enrichedMsg]);
          scrollToBottom();

          // Помечаем как прочитанное
          if (isSupportMessage) {
            await markSupportMessagesAsRead();
          } else {
            await markMessagesAsRead(senderId);
          }

          // Обновляем беседу без загрузки (сбрасываем unread т.к. чат открыт)
          updateConversationInSplit(conversationId, conv => ({
            ...conv,
            lastMessage: enrichedMsg,
            unreadCount: 0,
          }));
        } else {
          // Показываем уведомление если чат не открыт
          if (isSupportMessage) {
            notifyNewMessage('Служба поддержки', enrichedMsg.content);
          } else {
            const senderConv = conversationsRef.current.find(c => c.recipientId === senderId);
            if (senderConv) {
              notifyNewMessage(senderConv.recipientName, enrichedMsg.content);
            }
          }

          // Чат не открыт - увеличиваем счётчик непрочитанных
          updateConversationInSplit(conversationId, conv => ({
            ...conv,
            lastMessage: enrichedMsg,
            unreadCount: conv.unreadCount + 1,
          }));
        }

        // Синхронизируем счётчики с сервером через 2 сек после последнего сообщения
        // Это гарантирует корректность данных даже при быстром потоке сообщений
        debouncedSyncCounters();
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return () => unsubscribe();
  }, [user?.id, scrollToBottom, notifyNewMessage, updateConversationInSplit, debouncedSyncCounters]);

  // Скролл при изменении сообщений
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const loadMessages = async (recipientId: string) => {
    // Увеличиваем ID запроса для предотвращения race condition
    const currentRequestId = ++loadMessagesRequestId.current;
    const isSupportChat = recipientId === SUPPORT_VIRTUAL_ID;

    try {
      setIsLoadingMessages(true);

      // Для поддержки используем отдельную функцию
      const msgs = isSupportChat
        ? await getSupportMessages()
        : await getMessages(recipientId);

      // Проверяем, что этот запрос всё ещё актуален
      if (currentRequestId !== loadMessagesRequestId.current) {
        return; // Пользователь переключился на другую беседу
      }

      setMessages(msgs);

      // Помечаем как прочитанные
      if (isSupportChat) {
        await markSupportMessagesAsRead();
      } else {
        await markMessagesAsRead(recipientId);
      }

      // Обновляем счётчик в списке бесед
      updateConversationInSplit(recipientId, conv => ({
        ...conv,
        unreadCount: 0,
      }));
    } catch (error) {
      // Игнорируем ошибки устаревших запросов
      if (currentRequestId !== loadMessagesRequestId.current) return;

      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      // Сбрасываем loading только для актуального запроса
      if (currentRequestId === loadMessagesRequestId.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.recipientId);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Максимум 10 МБ
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер файла — 10 МБ',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    // Сбрасываем input для возможности повторного выбора того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user?.id || isSending) return;

    const messageContent = newMessage.trim() || (selectedFile ? `Файл: ${selectedFile.name}` : '');
    const tempId = `temp-${Date.now()}`;
    const recipientId = selectedConversation.recipientId;
    const isSupportChat = recipientId === SUPPORT_VIRTUAL_ID;
    const fileToUpload = selectedFile;

    // Оптимистичное сообщение
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: messageContent,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_support_message: isSupportChat,
      // Временные данные для превью
      attachment_name: fileToUpload?.name,
      attachment_type: fileToUpload?.type,
      attachment_size: fileToUpload?.size,
    };

    // Сразу показываем сообщение
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    scrollToBottom();
    setIsSending(true);

    try {
      // Сначала загружаем файл, если есть
      let attachment: AttachmentInfo | undefined;
      if (fileToUpload) {
        setIsUploading(true);
        try {
          // Для поддержки используем 'support' как recipientId в пути файла
          const uploadRecipientId = isSupportChat ? 'support' : recipientId;
          attachment = await uploadAttachment(uploadRecipientId, fileToUpload);
        } finally {
          setIsUploading(false);
        }
      }

      // Для поддержки используем отдельную функцию
      const sent = isSupportChat
        ? await sendSupportMessage(messageContent, attachment)
        : await sendMessage(recipientId, messageContent, attachment);

      // Обогащаем signed URL если есть вложение
      const enrichedSent = await enrichMessageWithSignedUrl(sent);

      // Заменяем оптимистичное сообщение реальным
      setMessages(prev => prev.map(m => m.id === tempId ? enrichedSent : m));

      // Обновляем последнее сообщение в беседе
      updateConversationInSplit(recipientId, conv => ({
        ...conv,
        lastMessage: enrichedSent,
      }));
    } catch (error) {
      console.error('Error sending message:', error);

      // Откат: удаляем оптимистичное сообщение и восстанавливаем текст
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
      }

      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Debounce для поиска - задержка фильтрации при быстром вводе
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Текущие беседы в зависимости от активной вкладки
  const currentTabConversations = useMemo(() =>
    activeTab === 'specialists' ? splitConversations.specialists : splitConversations.support,
    [activeTab, splitConversations]
  );

  // Фильтрация бесед по поиску (использует отложенное значение)
  const filteredConversations = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase();
    if (!query) return currentTabConversations;
    return currentTabConversations.filter((conv) =>
      conv.recipientName.toLowerCase().includes(query) ||
      conv.specialization?.toLowerCase().includes(query) ||
      conv.adminRole?.toLowerCase().includes(query)
    );
  }, [currentTabConversations, deferredSearchQuery]);

  // Получаем метку типа собеседника
  const getRecipientTypeLabel = (conv: Conversation) => {
    if (conv.recipientType === 'specialist') {
      return conv.specialization || 'Специалист';
    }
    if (conv.recipientType === 'admin') {
      return conv.adminRole || 'Поддержка';
    }
    return 'Клиент';
  };

  // Получаем стили для типа собеседника
  const getRecipientTypeStyles = (type: string) => {
    switch (type) {
      case 'specialist':
        return { textClass: 'text-foreground' };
      case 'admin':
        return { textClass: 'text-foreground' };
      default:
        return { textClass: 'text-muted-foreground' };
    }
  };

  // Количество непрочитанных по вкладкам
  const unreadByTab = useMemo(() => ({
    specialists: splitConversations.specialists.reduce((sum, c) => sum + c.unreadCount, 0),
    support: splitConversations.support.reduce((sum, c) => sum + c.unreadCount, 0),
  }), [splitConversations]);

  // Общее количество непрочитанных
  const totalUnread = useMemo(() =>
    unreadByTab.specialists + unreadByTab.support,
    [unreadByTab]
  );

  // Обработчик создания нового обращения в поддержку
  const handleCreateSupportRequest = () => {
    // Сначала проверяем, есть ли уже существующая беседа с поддержкой
    const existingSupportConversation = splitConversations.support.find(
      conv => conv.recipientId === SUPPORT_VIRTUAL_ID
    );

    if (existingSupportConversation) {
      // Если беседа уже существует - выбираем её и загружаем историю сообщений
      handleSelectConversation(existingSupportConversation);
    } else {
      // Создаём виртуальную беседу "Служба поддержки" и выбираем её
      const newConversation: Conversation = {
        recipientId: SUPPORT_VIRTUAL_ID,
        recipientName: 'Служба поддержки',
        recipientAvatar: null,
        recipientType: 'admin',
        adminRole: 'Поддержка',
        lastMessage: null,
        unreadCount: 0,
      };

      setSelectedConversation(newConversation);
      // Загружаем сообщения даже для "новой" беседы - там могут быть старые сообщения
      loadMessages(SUPPORT_VIRTUAL_ID);
      setActiveTab('support');
      if (isMobileView) {
        setShowChatOnMobile(true);
      }
    }
  };

  // Компонент загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background px-4 py-3">
          <div className="container mx-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cabinet')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Сообщения</h1>
          </div>
        </header>

        <div className="container mx-auto max-w-6xl p-4">
          <Card className="h-[calc(100vh-8rem)]">
            <div className="flex h-full">
              <div className="w-full md:w-80 md:border-r p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
              <div className="hidden md:flex flex-1 items-center justify-center">
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Список бесед (для десктопа и мобильного)
  // ВАЖНО: используем JSX-переменную, а не функциональный компонент внутри render,
  // чтобы избежать пересоздания DOM при каждом рендере (фикс проблемы с вводом в чат)
  const conversationsList = (
    <div className={`flex flex-col ${isMobileView ? 'h-full w-full' : 'w-80 border-r shrink-0'}`}>
      {/* Заголовок */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-2xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-honey" />
            Сообщения
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-cloud/50 rounded-full"
            onClick={requestPermission}
            title={permission === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
          >
            {permission === 'granted' ? (
              <Bell className="h-4 w-4 text-honey" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Вкладки: Поддержка / Специалисты */}
        <div className="flex rounded-xl bg-cloud p-1 mb-3">
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'support'
                ? 'bg-white text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>Поддержка</span>
            {unreadByTab.support > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 bg-honey text-ink font-light hover:bg-honey">
                {unreadByTab.support}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('specialists')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'specialists'
                ? 'bg-white text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Специалисты</span>
            {unreadByTab.specialists > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 bg-honey text-ink font-light hover:bg-honey">
                {unreadByTab.specialists}
              </Badge>
            )}
          </button>
        </div>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Кнопка "Написать в поддержку" для вкладки Поддержка */}
        {activeTab === 'support' && splitConversations.hasNewSupportOption && (
          <div className="p-2 border-b">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-full font-light"
              onClick={handleCreateSupportRequest}
              disabled={isCreatingSupport}
            >
              {isCreatingSupport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Написать в поддержку
            </Button>
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {activeTab === 'specialists' ? (
              <>
                <Users className="mx-auto h-12 w-12 mb-3 opacity-50 text-lavender" />
                <p className="text-sm font-medium mb-1">
                  {searchQuery ? 'Ничего не найдено' : 'Нет назначенных специалистов'}
                </p>
                <p className="text-xs font-light">
                  {!searchQuery && 'Специалист будет назначен после консультации'}
                </p>
              </>
            ) : (
              <>
                <Headphones className="mx-auto h-12 w-12 mb-3 opacity-50 text-lavender" />
                <p className="text-sm font-medium mb-1">
                  {searchQuery ? 'Ничего не найдено' : 'Нет активных обращений'}
                </p>
                <p className="text-xs font-light">
                  {!searchQuery && 'Нажмите "Написать в поддержку" чтобы задать вопрос'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.recipientId}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedConversation?.recipientId === conv.recipientId
                    ? 'bg-lavender-pale/50 border border-lavender/30 shadow-soft'
                    : 'hover:bg-cloud/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conv.recipientAvatar ? (
                      <img
                        src={conv.recipientAvatar}
                        alt={conv.recipientName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-lavender-pale flex items-center justify-center text-sm font-bold text-lavender">
                        {getInitials(conv.recipientName)}
                      </div>
                    )}
                    {/* Иконка типа собеседника */}
                    {conv.recipientType === 'admin' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-lavender text-ink shadow-soft">
                        <Shield className="w-3 h-3" />
                      </div>
                    )}
                    {conv.recipientType === 'specialist' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-honey text-ink shadow-soft">
                        <Stethoscope className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold truncate">{conv.recipientName}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground font-light">
                          {formatMessageTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mb-1 font-light ${getRecipientTypeStyles(conv.recipientType).textClass}`}>
                      {getRecipientTypeLabel(conv)}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate font-light">
                        {conv.lastMessage.sender_id === user?.id ? 'Вы: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="ml-2 bg-honey text-ink font-light hover:bg-honey">{conv.unreadCount}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Пагинация для специалистов */}
      {activeTab === 'specialists' && totalPages > 1 && (
        <div className="p-2 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentPage} / {totalPages} ({totalCount})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // Область чата
  // ВАЖНО: используем JSX-переменную, а не функциональный компонент внутри render
  const chatArea = (
    <div className="flex-1 flex flex-col h-full">
      {selectedConversation ? (
        <>
          {/* Заголовок чата */}
          <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-white/50 backdrop-blur-sm">
            {isMobileView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="mr-1 rounded-full hover:bg-cloud/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="relative">
              {selectedConversation.recipientAvatar ? (
                <img
                  src={selectedConversation.recipientAvatar}
                  alt={selectedConversation.recipientName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-lavender-pale flex items-center justify-center text-sm font-bold text-lavender">
                  {getInitials(selectedConversation.recipientName)}
                </div>
              )}
              {selectedConversation.recipientType === 'admin' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-lavender text-ink shadow-soft">
                  <Shield className="w-3 h-3" />
                </div>
              )}
              {selectedConversation.recipientType === 'specialist' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-honey text-ink shadow-soft">
                  <Stethoscope className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold">{selectedConversation.recipientName}</p>
              <p className={`text-sm font-light ${getRecipientTypeStyles(selectedConversation.recipientType).textClass}`}>
                {getRecipientTypeLabel(selectedConversation)}
              </p>
            </div>
          </div>

          {/* Сообщения */}
          <ScrollArea className="flex-1 p-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50 text-lavender" />
                <p className="text-lg font-bold">Начните беседу</p>
                <p className="text-sm mt-1 text-center max-w-xs font-light">
                  {selectedConversation.recipientType === 'admin'
                    ? 'Напишите в службу поддержки - мы рады помочь!'
                    : 'Напишите вашему специалисту первым или дождитесь его сообщения'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-[70%] rounded-xl px-4 py-2 shadow-soft ${
                          isOwn
                            ? 'bg-honey text-ink rounded-br-sm'
                            : 'bg-white border border-border/30 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        {/* Вложение */}
                        {message.attachment_url && message.attachment_name && message.attachment_type && message.attachment_size && (
                          <MessageAttachment
                            url={message.attachment_url}
                            name={message.attachment_name}
                            type={message.attachment_type}
                            size={message.attachment_size}
                            isOwn={isOwn}
                          />
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-xs ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
                            {formatMessageTime(message.created_at)}
                          </span>
                          {isOwn && (
                            message.is_read ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Ввод сообщения */}
          <div className="p-4 border-t border-border/50 bg-white/50 backdrop-blur-sm space-y-2">
            {/* Превью выбранного файла */}
            {selectedFile && (
              <AttachmentPreview
                file={selectedFile}
                onRemove={() => setSelectedFile(null)}
              />
            )}
            <div className="flex gap-2">
              {/* Скрытый input для файла */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isUploading}
                title="Прикрепить файл"
                className="rounded-full hover:bg-cloud/50"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Напишите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending || isUploading}
                className="flex-1 rounded-full"
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                size="icon"
                className="rounded-full bg-honey text-ink hover:bg-honey-dark shadow-soft"
              >
                {isSending || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <MessageSquare className="h-16 w-16 mb-4 opacity-50 text-lavender" />
          <p className="text-lg font-bold">Выберите беседу</p>
          <p className="text-sm mt-1 text-center max-w-xs font-light">
            Выберите собеседника из списка слева, чтобы начать или продолжить беседу
          </p>
        </div>
      )}
    </div>
  );

  const backgroundStyle = {
    background: 'var(--bg-golden-hour)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="min-h-screen flex flex-col" style={backgroundStyle}>
      {/* Header */}
      <header 
        className="border-b border-[#1a1a1a]/10 px-4 py-3 shrink-0"
        style={{
          background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="container mx-auto max-w-6xl flex items-center justify-center relative">
          <button
            onClick={() => navigate('/cabinet')}
            className="cursor-pointer"
          >
            <img src="/logo.png" alt="Waves" className="h-12 w-auto" />
          </button>
          {totalUnread > 0 && (
            <Badge variant="secondary" className="absolute right-0 bg-honey text-ink font-light hover:bg-honey">
              {totalUnread} новых
            </Badge>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 container mx-auto max-w-6xl p-4">
        <Card className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl shadow-soft border-2"
          style={{
            background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {isMobileView ? (
            // Мобильный вид: показываем либо список, либо чат
            showChatOnMobile && selectedConversation ? (
              chatArea
            ) : (
              conversationsList
            )
          ) : (
            // Десктопный вид: показываем оба панели
            <div className="flex h-full">
              {conversationsList}
              {chatArea}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
