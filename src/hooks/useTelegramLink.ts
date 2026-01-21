/**
 * Hook for managing Telegram account linking
 *
 * Provides functionality to:
 * - Generate temporary linking tokens
 * - Check current link status
 * - Unlink Telegram account
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TelegramLinkStatus {
  isLinked: boolean;
  isActive: boolean;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  linkedAt: string | null;
}

interface LinkToken {
  token: string;
  expiresAt: Date;
  botUsername: string;
}

export function useTelegramLink() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TelegramLinkStatus>({
    isLinked: false,
    isActive: false,
    telegramUsername: null,
    telegramFirstName: null,
    linkedAt: null,
  });
  const [linkToken, setLinkToken] = useState<LinkToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current status
  const loadStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: rpcError } = await supabase.rpc('get_telegram_link_status', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      if (data) {
        setStatus({
          isLinked: data.is_linked || false,
          isActive: data.is_active || false,
          telegramUsername: data.telegram_username || null,
          telegramFirstName: data.telegram_first_name || null,
          linkedAt: data.linked_at || null,
        });
      }
    } catch (err) {
      console.error('Error loading Telegram link status:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Generate new link token
  const generateToken = useCallback(async (): Promise<LinkToken | null> => {
    if (!user?.id) {
      setError('Необходимо авторизоваться');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('generate_telegram_link_token', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        const tokenData = data[0];
        const token: LinkToken = {
          token: tokenData.token,
          expiresAt: new Date(tokenData.expires_at),
          botUsername: tokenData.bot_username || 'balansity_notification_bot',
        };
        setLinkToken(token);
        return token;
      }

      throw new Error('Не удалось создать токен');
    } catch (err: any) {
      console.error('Error generating Telegram link token:', err);
      setError(err.message || 'Ошибка при создании токена');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Unlink Telegram account
  const unlink = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Необходимо авторизоваться');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('unlink_telegram_account', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      // Reset status
      setStatus({
        isLinked: false,
        isActive: false,
        telegramUsername: null,
        telegramFirstName: null,
        linkedAt: null,
      });
      setLinkToken(null);

      return true;
    } catch (err: any) {
      console.error('Error unlinking Telegram:', err);
      setError(err.message || 'Ошибка при отключении Telegram');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Toggle notifications (enable/disable without unlinking)
  const toggleNotifications = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!user?.id) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_telegram_links')
        .update({ is_active: enabled, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setStatus((prev) => ({ ...prev, isActive: enabled }));
      return true;
    } catch (err: any) {
      console.error('Error toggling Telegram notifications:', err);
      setError(err.message || 'Ошибка при изменении настроек');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Build deep link URL
  const getDeepLink = useCallback((token: string, botUsername: string): string => {
    return `https://t.me/${botUsername}?start=${token}`;
  }, []);

  // Build QR code URL (using external API)
  const getQRCodeUrl = useCallback((deepLink: string, size: number = 256): string => {
    // Using goqr.me API - free and reliable
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(deepLink)}&format=svg`;
  }, []);

  return {
    status,
    linkToken,
    isLoading,
    error,
    generateToken,
    unlink,
    toggleNotifications,
    getDeepLink,
    getQRCodeUrl,
    refreshStatus: loadStatus,
  };
}

export default useTelegramLink;
