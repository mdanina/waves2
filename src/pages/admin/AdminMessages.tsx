/**
 * Страница сообщений администратора
 * Внутренний мессенджер: общение с клиентами, специалистами и другими админами
 */

import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
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
  User,
  Stethoscope,
  Shield,
  Bell,
  BellOff,
  Paperclip,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Message,
  Conversation,
  RecipientType,
  AttachmentInfo,
  GroupConversation,
  GroupMessage,
  PaginatedConversations,
  DEFAULT_PAGE_SIZE,
  getAdminConversations,
  getMessages,
  sendMessage,
  uploadAttachment,
  markMessagesAsRead,
  subscribeToMessages,
  getChatGroups,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessagesAsRead,
  createChatGroup,
  subscribeToGroupMessages,
  enrichMessageWithSignedUrl,
  // Функции для единой службы поддержки
  getAdminSupportMessages,
  markAdminSupportMessagesAsRead,
  sendSupportReply,
  subscribeToSupportMessages,
} from '@/lib/supabase-messages';
import { formatMessageTime, getInitials, pluralize, debounce } from '@/lib/utils';
import { MessageAttachment, AttachmentPreview } from '@/components/chat/MessageAttachment';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type FilterType = 'all' | 'client' | 'specialist' | 'admin';

export default function AdminMessages() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const { permission, requestPermission, notifyNewMessage } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMessagesRequestId = useRef(0);
  const loadGroupMessagesRequestId = useRef(0);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const selectedGroupRef = useRef<GroupConversation | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Групповые чаты
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Пагинация групповых чатов
  const [groupCurrentPage, setGroupCurrentPage] = useState(1);
  const [groupTotalPages, setGroupTotalPages] = useState(1);
  const [groupTotalCount, setGroupTotalCount] = useState(0);

  // Диалог создания группы
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const loadConversations = useCallback(async (page: number = 1, showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const result = await getAdminConversations({ page, pageSize: DEFAULT_PAGE_SIZE });
      setConversations(result.conversations);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
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

  useEffect(() => {
    if (user?.id) {
      loadConversations(1, true);
    }
  }, [user?.id, loadConversations]);

  // Обработчики пагинации
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

  // Debounced функция синхронизации счётчиков при фокусе окна
  const debouncedSyncCounters = useMemo(
    () => debounce(() => {
      loadConversations(currentPage, false);
    }, 2000),
    [loadConversations, currentPage]
  );

  // Синхронизация счётчиков при возврате фокуса на окно
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

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToMessages(user.id, async (newMsg) => {
      try {
        // Пропускаем сообщения поддержки - они обрабатываются отдельной подпиской
        if (newMsg.is_support_message === true) return;

        const senderId = newMsg.sender_id;
        const currentConversation = selectedConversationRef.current;

        // Обогащаем сообщение signed URL если есть вложение
        const enrichedMsg = await enrichMessageWithSignedUrl(newMsg);

        // Проверяем, что текущая беседа не изменилась после async операции
        const stillSameConversation = selectedConversationRef.current?.recipientId === currentConversation?.recipientId;

        if (currentConversation && senderId === currentConversation.recipientId && stillSameConversation) {
          setMessages(prev => [...prev, enrichedMsg]);
          // Прокручиваем к последнему сообщению
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          await markMessagesAsRead(senderId);
          setConversations(prev => prev.map(conv =>
            conv.recipientId === senderId
              ? { ...conv, lastMessage: enrichedMsg, unreadCount: 0 }
              : conv
          ));
        } else {
          // Показываем уведомление если чат не открыт
          const senderConv = conversationsRef.current.find(c => c.recipientId === senderId);
          if (senderConv) {
            notifyNewMessage(senderConv.recipientName, enrichedMsg.content);
          }

          setConversations(prev => prev.map(conv =>
            conv.recipientId === senderId
              ? { ...conv, lastMessage: enrichedMsg, unreadCount: conv.unreadCount + 1 }
              : conv
          ));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return () => unsubscribe();
  }, [user?.id, notifyNewMessage]);

  // Подписка на сообщения поддержки (отдельный канал для всех админов)
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToSupportMessages(async (newMsg) => {
      try {
        // Пропускаем свои сообщения (они добавляются оптимистично)
        if (newMsg.sender_id === user.id) return;

        const senderId = newMsg.sender_id;
        const currentConversation = selectedConversationRef.current;

        // Обогащаем сообщение signed URL если есть вложение
        const enrichedMsg = await enrichMessageWithSignedUrl(newMsg);

        // Проверяем, открыт ли чат с этим клиентом
        const isChatWithThisClient = currentConversation?.recipientId === senderId &&
          currentConversation?.recipientType === 'client';

        if (isChatWithThisClient) {
          setMessages(prev => [...prev, enrichedMsg]);
          // Прокручиваем к последнему сообщению
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          await markAdminSupportMessagesAsRead(senderId);
          setConversations(prev => prev.map(conv =>
            conv.recipientId === senderId
              ? { ...conv, lastMessage: enrichedMsg, unreadCount: 0 }
              : conv
          ));
        } else {
          // Показываем уведомление если чат не открыт
          const senderConv = conversationsRef.current.find(c => c.recipientId === senderId);
          if (senderConv) {
            notifyNewMessage(senderConv.recipientName, enrichedMsg.content);
          }

          // Обновляем счётчик непрочитанных
          setConversations(prev => {
            // Проверяем, есть ли уже этот клиент в списке
            const existingConv = prev.find(c => c.recipientId === senderId);
            if (existingConv) {
              return prev.map(conv =>
                conv.recipientId === senderId
                  ? { ...conv, lastMessage: enrichedMsg, unreadCount: conv.unreadCount + 1 }
                  : conv
              );
            }
            // Если клиента нет в списке - перезагружаем список бесед
            loadConversations(currentPage, false);
            return prev;
          });
        }
      } catch (error) {
        console.error('Error processing support message:', error);
      }
    });

    return () => unsubscribe();
  }, [user?.id, notifyNewMessage, loadConversations, currentPage]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (groupMessages.length > 0) {
      scrollToBottom();
    }
  }, [groupMessages, scrollToBottom]);

  const loadMessages = async (recipientId: string, recipientType: RecipientType) => {
    const currentRequestId = ++loadMessagesRequestId.current;

    try {
      setIsLoadingMessages(true);

      // Для клиентов используем единую службу поддержки - все админы видят все сообщения
      const isClient = recipientType === 'client';
      const msgs = isClient
        ? await getAdminSupportMessages(recipientId)
        : await getMessages(recipientId);

      if (currentRequestId !== loadMessagesRequestId.current) return;

      setMessages(msgs);

      // Помечаем как прочитанные (разные функции для клиентов и остальных)
      if (isClient) {
        await markAdminSupportMessagesAsRead(recipientId);
      } else {
        await markMessagesAsRead(recipientId);
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === recipientId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      if (currentRequestId !== loadMessagesRequestId.current) return;

      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      if (currentRequestId === loadMessagesRequestId.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedGroup(null); // Сбрасываем групповой чат
    loadMessages(conversation.recipientId, conversation.recipientType);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Файл слишком большой',
          description: 'Максимальный размер файла — 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
    // Сбрасываем input чтобы можно было выбрать тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user || isSending || isUploading) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const recipientId = selectedConversation.recipientId;
    const fileToUpload = selectedFile;

    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: messageContent,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachment_url: fileToUpload ? URL.createObjectURL(fileToUpload) : null,
      attachment_name: fileToUpload?.name || null,
      attachment_type: fileToUpload?.type || null,
      attachment_size: fileToUpload?.size || null,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    scrollToBottom();
    setIsSending(true);

    try {
      let attachment: AttachmentInfo | undefined;

      // Загружаем файл если есть
      if (fileToUpload) {
        setIsUploading(true);
        attachment = await uploadAttachment(recipientId, fileToUpload);
        setIsUploading(false);
      }

      // Для клиентов используем sendSupportReply с флагом is_support_message
      const isClient = selectedConversation.recipientType === 'client';
      const sent = isClient
        ? await sendSupportReply(recipientId, messageContent, attachment)
        : await sendMessage(recipientId, messageContent, attachment);
      // Обогащаем signed URL если есть вложение
      const enrichedSent = await enrichMessageWithSignedUrl(sent);
      setMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          // Освобождаем blob URL если был создан
          if (m.attachment_url?.startsWith('blob:')) {
            URL.revokeObjectURL(m.attachment_url);
          }
          return enrichedSent;
        }
        return m;
      }));
      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === recipientId
            ? { ...conv, lastMessage: enrichedSent }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Освобождаем blob URL при ошибке
      setMessages(prev => {
        const msgToRemove = prev.find(m => m.id === tempId);
        if (msgToRemove?.attachment_url?.startsWith('blob:')) {
          URL.revokeObjectURL(msgToRemove.attachment_url);
        }
        return prev.filter(m => m.id !== tempId);
      });
      // Восстанавливаем сообщение и файл при ошибке
      setNewMessage(messageContent);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
      }
      setIsUploading(false);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // === Групповые чаты ===

  const loadGroupConversations = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingGroups(true);
      const result = await getChatGroups({ page, pageSize: DEFAULT_PAGE_SIZE });
      setGroupConversations(result.conversations);
      setGroupCurrentPage(result.page);
      setGroupTotalPages(result.totalPages);
      setGroupTotalCount(result.totalCount);
      setGroupsLoaded(true);
    } catch (error) {
      console.error('Error loading group conversations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить групповые чаты',
        variant: 'destructive',
      });
      // Не ставим groupsLoaded = true при ошибке, чтобы можно было повторить
    } finally {
      setIsLoadingGroups(false);
    }
  }, [toast]);

  // Загружаем группы при переключении на таб (только если ещё не загружены)
  useEffect(() => {
    if (activeTab === 'groups' && !groupsLoaded && !isLoadingGroups) {
      loadGroupConversations(1);
    }
  }, [activeTab, groupsLoaded, isLoadingGroups, loadGroupConversations]);

  // Обработчики пагинации групповых чатов
  const handleGroupPrevPage = useCallback(() => {
    if (groupCurrentPage > 1) {
      loadGroupConversations(groupCurrentPage - 1);
    }
  }, [groupCurrentPage, loadGroupConversations]);

  const handleGroupNextPage = useCallback(() => {
    if (groupCurrentPage < groupTotalPages) {
      loadGroupConversations(groupCurrentPage + 1);
    }
  }, [groupCurrentPage, groupTotalPages, loadGroupConversations]);

  const handleSelectGroup = async (group: GroupConversation) => {
    const currentRequestId = ++loadGroupMessagesRequestId.current;
    const groupId = group.group.id;

    setSelectedGroup(group);
    setSelectedConversation(null); // Сбрасываем личный чат

    try {
      setIsLoadingGroupMessages(true);
      const msgs = await getGroupMessages(groupId);

      // Проверяем, что это актуальный запрос
      if (currentRequestId !== loadGroupMessagesRequestId.current) return;

      setGroupMessages(msgs);

      // Помечаем как прочитанные
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        await markGroupMessagesAsRead(groupId, lastMsg.id);

        // Обновляем счётчик непрочитанных
        setGroupConversations(prev =>
          prev.map(g =>
            g.group.id === groupId
              ? { ...g, unreadCount: 0 }
              : g
          )
        );
      }
    } catch (error) {
      // Игнорируем ошибки устаревших запросов
      if (currentRequestId !== loadGroupMessagesRequestId.current) return;

      console.error('Error loading group messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения группы',
        variant: 'destructive',
      });
    } finally {
      if (currentRequestId === loadGroupMessagesRequestId.current) {
        setIsLoadingGroupMessages(false);
      }
    }
  };

  // Подписка на сообщения группы
  useEffect(() => {
    if (!selectedGroup || !user?.id) return;

    const groupId = selectedGroup.group.id;
    const members = selectedGroup.members;

    const unsubscribe = subscribeToGroupMessages(groupId, async (newMsg) => {
      try {
        // Не добавляем свои сообщения (они добавляются оптимистично)
        if (newMsg.sender_id === user.id) return;

        // Добавляем имя отправителя из списка участников группы
        const sender = members.find(m => m.user_id === newMsg.sender_id);
        let enrichedMsg: GroupMessage = {
          ...newMsg,
          senderName: sender?.userName || 'Пользователь',
          senderAvatar: sender?.userAvatar || null,
        };

        // Обогащаем signed URL если есть вложение
        enrichedMsg = await enrichMessageWithSignedUrl(enrichedMsg);

        // Проверяем, что мы всё ещё просматриваем ту же группу после async операции
        if (selectedGroupRef.current?.group.id !== groupId) return;

        setGroupMessages(prev => [...prev, enrichedMsg]);
        // Прокручиваем к последнему сообщению
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Помечаем как прочитанное
        await markGroupMessagesAsRead(groupId, newMsg.id);
      } catch (error) {
        console.error('Error processing group message:', error);
      }
    });

    return () => unsubscribe();
  }, [selectedGroup?.group.id, user?.id]);

  const handleSendGroupMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedGroup || !user || isSending || isUploading) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const groupId = selectedGroup.group.id;
    const fileToUpload = selectedFile;

    const optimisticMessage: GroupMessage = {
      id: tempId,
      group_id: groupId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      senderName: 'Вы',
      attachment_url: fileToUpload ? URL.createObjectURL(fileToUpload) : null,
      attachment_name: fileToUpload?.name || null,
      attachment_type: fileToUpload?.type || null,
      attachment_size: fileToUpload?.size || null,
    };

    setGroupMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    scrollToBottom();
    setIsSending(true);

    try {
      let attachment: AttachmentInfo | undefined;

      if (fileToUpload) {
        setIsUploading(true);
        // Используем groupId как "recipientId" для пути в storage
        attachment = await uploadAttachment(groupId, fileToUpload);
        setIsUploading(false);
      }

      const sent = await sendGroupMessage(groupId, messageContent, attachment);
      // Обогащаем signed URL если есть вложение
      const enrichedSent = await enrichMessageWithSignedUrl(sent);
      setGroupMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          // Освобождаем blob URL если был создан
          if (m.attachment_url?.startsWith('blob:')) {
            URL.revokeObjectURL(m.attachment_url);
          }
          return { ...enrichedSent, senderName: 'Вы' };
        }
        return m;
      }));

      // Обновляем последнее сообщение в списке групп
      setGroupConversations(prev =>
        prev.map(g =>
          g.group.id === groupId
            ? { ...g, lastMessage: { ...enrichedSent, senderName: 'Вы' } }
            : g
        )
      );
    } catch (error) {
      console.error('Error sending group message:', error);
      // Освобождаем blob URL при ошибке
      setGroupMessages(prev => {
        const msgToRemove = prev.find(m => m.id === tempId);
        if (msgToRemove?.attachment_url?.startsWith('blob:')) {
          URL.revokeObjectURL(msgToRemove.attachment_url);
        }
        return prev.filter(m => m.id !== tempId);
      });
      // Восстанавливаем сообщение и файл при ошибке
      setNewMessage(messageContent);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
      }
      setIsUploading(false);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0 || isCreatingGroup) return;

    setIsCreatingGroup(true);
    try {
      await createChatGroup(newGroupName.trim(), selectedMembers);

      // Перезагружаем список групп
      await loadGroupConversations();

      // Закрываем диалог и сбрасываем форму
      setShowCreateGroupDialog(false);
      setNewGroupName('');
      setSelectedMembers([]);

      toast({
        title: 'Группа создана',
        description: `Группа "${newGroupName.trim()}" успешно создана`,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать группу',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredConversations = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Фильтр по типу
      if (filterType !== 'all' && conv.recipientType !== filterType) {
        return false;
      }
      // Фильтр по поиску
      if (!query) return true;
      return conv.recipientName.toLowerCase().includes(query) ||
        conv.specialization?.toLowerCase().includes(query) ||
        conv.adminRole?.toLowerCase().includes(query);
    });
  }, [conversations, deferredSearchQuery, filterType]);

  // Получаем стили и иконку для типа собеседника
  const getRecipientTypeStyles = (type: RecipientType) => {
    switch (type) {
      case 'client':
        return { bgClass: 'bg-green-100 text-green-600', textClass: 'text-green-600', Icon: User };
      case 'specialist':
        return { bgClass: 'bg-blue-100 text-blue-600', textClass: 'text-blue-600', Icon: Stethoscope };
      case 'admin':
        return { bgClass: 'bg-purple-100 text-purple-600', textClass: 'text-purple-600', Icon: Shield };
    }
  };

  const getRecipientTypeLabel = (conv: Conversation) => {
    if (conv.recipientType === 'specialist') {
      return conv.specialization || 'Специалист';
    }
    if (conv.recipientType === 'admin') {
      return conv.adminRole || 'Администратор';
    }
    return 'Клиент';
  };

  // Подсчёт по типам за один проход
  const counts = useMemo(() => {
    const result = { all: conversations.length, client: 0, specialist: 0, admin: 0 };
    for (const conv of conversations) {
      result[conv.recipientType]++;
    }
    return result;
  }, [conversations]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            <div className="w-80 border-r p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Список бесед */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Сообщения</h2>
                <div className="flex items-center gap-1">
                  {activeTab === 'groups' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowCreateGroupDialog(true)}
                      title="Создать группу"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={requestPermission}
                    title={permission === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
                  >
                    {permission === 'granted' ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Табы: Личные / Группы */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'direct' | 'groups')}>
                <TabsList className="w-full">
                  <TabsTrigger value="direct" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Личные
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="flex-1">
                    <Users className="h-4 w-4 mr-1" />
                    Группы
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTab === 'direct' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Фильтры */}
                  <div className="flex gap-1 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="text-xs h-7"
                >
                  Все ({counts.all})
                </Button>
                <Button
                  variant={filterType === 'client' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('client')}
                  className="text-xs h-7"
                >
                  <User className="w-3 h-3 mr-1" />
                  {counts.client}
                </Button>
                <Button
                  variant={filterType === 'specialist' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('specialist')}
                  className="text-xs h-7"
                >
                  <Stethoscope className="w-3 h-3 mr-1" />
                  {counts.specialist}
                </Button>
                    <Button
                      variant={filterType === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('admin')}
                      className="text-xs h-7"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {counts.admin}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Список личных чатов */}
            {activeTab === 'direct' && (
              <>
                <ScrollArea className="flex-1">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchQuery || filterType !== 'all' ? 'Ничего не найдено' : 'Нет собеседников'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredConversations.map((conv) => {
                        const styles = getRecipientTypeStyles(conv.recipientType);
                        return (
                          <button
                            key={conv.recipientId}
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full p-3 rounded-lg text-left transition-colors ${
                              selectedConversation?.recipientId === conv.recipientId
                                ? 'bg-primary/10'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {conv.recipientAvatar ? (
                                  <img
                                    src={conv.recipientAvatar}
                                    alt={conv.recipientName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {getInitials(conv.recipientName)}
                                  </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${styles.bgClass}`}>
                                  <styles.Icon className="w-3 h-3" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{conv.recipientName}</p>
                                  {conv.lastMessage && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatMessageTime(conv.lastMessage.created_at)}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs truncate mb-0.5 ${styles.textClass}`}>
                                  {getRecipientTypeLabel(conv)}
                                </p>
                                {conv.lastMessage && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {conv.lastMessage.sender_id === user?.id ? 'Вы: ' : ''}
                                    {conv.lastMessage.content}
                                  </p>
                                )}
                              </div>
                              {conv.unreadCount > 0 && (
                                <Badge className="ml-2">{conv.unreadCount}</Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Пагинация */}
                {totalPages > 1 && (
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
              </>
            )}

            {/* Список групповых чатов */}
            {activeTab === 'groups' && (
              <>
              <ScrollArea className="flex-1">
                {isLoadingGroups ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : groupConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Нет групповых чатов</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowCreateGroupDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Создать группу
                    </Button>
                  </div>
                ) : (
                  <div className="p-2">
                    {groupConversations.map((gc) => (
                      <button
                        key={gc.group.id}
                        onClick={() => handleSelectGroup(gc)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedGroup?.group.id === gc.group.id
                            ? 'bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{gc.group.name}</p>
                              {gc.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(gc.lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {gc.members.length} {pluralize(gc.members.length, 'участник', 'участника', 'участников')}
                            </p>
                            {gc.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {gc.lastMessage.senderName}: {gc.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {gc.unreadCount > 0 && (
                            <Badge className="ml-2">{gc.unreadCount}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Пагинация групповых чатов */}
              {groupTotalPages > 1 && (
                <div className="p-2 border-t flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGroupPrevPage}
                    disabled={groupCurrentPage <= 1}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {groupCurrentPage} / {groupTotalPages} ({groupTotalCount})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGroupNextPage}
                    disabled={groupCurrentPage >= groupTotalPages}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
            )}
          </div>

          {/* Область чата */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Заголовок чата */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="relative">
                    {selectedConversation.recipientAvatar ? (
                      <img
                        src={selectedConversation.recipientAvatar}
                        alt={selectedConversation.recipientName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {getInitials(selectedConversation.recipientName)}
                      </div>
                    )}
                    {(() => {
                      const styles = getRecipientTypeStyles(selectedConversation.recipientType);
                      return (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${styles.bgClass}`}>
                          <styles.Icon className="w-3 h-3" />
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConversation.recipientName}</p>
                    <p className={`text-sm ${getRecipientTypeStyles(selectedConversation.recipientType).textClass}`}>
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
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните беседу</p>
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
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
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
                                <span className="text-xs opacity-70">
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
                <div className="p-4 border-t space-y-2">
                  {selectedFile && (
                    <AttachmentPreview
                      file={selectedFile}
                      onRemove={() => setSelectedFile(null)}
                    />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isUploading}
                      title="Прикрепить файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending || isUploading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
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
            ) : selectedGroup ? (
              <>
                {/* Заголовок группового чата */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedGroup.group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup.members.length} {pluralize(selectedGroup.members.length, 'участник', 'участника', 'участников')}
                    </p>
                  </div>
                </div>

                {/* Сообщения группы */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingGroupMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Users className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните беседу в группе</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupMessages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1 opacity-80">
                                  {message.senderName || 'Пользователь'}
                                </p>
                              )}
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
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
                                <span className="text-xs opacity-70">
                                  {formatMessageTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Ввод сообщения в группу */}
                <div className="p-4 border-t space-y-2">
                  {selectedFile && (
                    <AttachmentPreview
                      file={selectedFile}
                      onRemove={() => setSelectedFile(null)}
                    />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isUploading}
                      title="Прикрепить файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendGroupMessage();
                        }
                      }}
                      disabled={isSending || isUploading}
                    />
                    <Button
                      onClick={handleSendGroupMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
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
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Выберите беседу</p>
                <p className="text-sm mt-1">Выберите собеседника из списка слева</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Диалог создания группы */}
      <Dialog open={showCreateGroupDialog} onOpenChange={(open) => {
        setShowCreateGroupDialog(open);
        if (!open) {
          setNewGroupName('');
          setSelectedMembers([]);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать групповой чат</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Название группы</Label>
              <Input
                id="groupName"
                placeholder="Введите название..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Участники ({selectedMembers.length} выбрано)</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.recipientId}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => toggleMemberSelection(conv.recipientId)}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(conv.recipientId)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {conv.recipientAvatar ? (
                        <img
                          src={conv.recipientAvatar}
                          alt={conv.recipientName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {getInitials(conv.recipientName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{conv.recipientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getRecipientTypeLabel(conv)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGroupDialog(false);
                setNewGroupName('');
                setSelectedMembers([]);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
            >
              {isCreatingGroup ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
