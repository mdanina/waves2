// Утилиты для работы с очередями Supabase (pgmq)
import { supabase } from './supabase';
import { logger } from './logger';

// ============================================
// Типы для задач в очередях
// ============================================

export interface EmailTask {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
  priority?: number;
}

export interface ReportGenerationTask {
  assessment_id: string;
  user_id: string;
  report_type?: 'pdf' | 'csv' | 'json';
}

export interface PaymentProcessingTask {
  payment_id: string;
  action: 'verify' | 'refund' | 'update_status';
}

// ============================================
// Функции для добавления задач в очереди
// ============================================

/**
 * Добавить задачу отправки email в очередь
 */
export async function queueEmailTask(task: EmailTask): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('queue_email_task', {
      p_to: task.to,
      p_subject: task.subject,
      p_template: task.template,
      p_variables: task.variables || {},
      p_priority: task.priority || 0,
    });

    if (error) {
      logger.error('Error queueing email task:', error);
      throw error;
    }

    logger.info('Email task queued:', { to: task.to, subject: task.subject, msgId: data });
    return data;
  } catch (error) {
    logger.error('Failed to queue email task:', error);
    return null;
  }
}

/**
 * Добавить задачу генерации отчета в очередь
 */
export async function queueReportGeneration(
  assessmentId: string,
  userId: string,
  reportType: 'pdf' | 'csv' | 'json' = 'pdf'
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('queue_report_generation', {
      p_assessment_id: assessmentId,
      p_user_id: userId,
      p_report_type: reportType,
    });

    if (error) {
      logger.error('Error queueing report generation task:', error);
      throw error;
    }

    logger.info('Report generation task queued:', { assessmentId, userId, msgId: data });
    return data;
  } catch (error) {
    logger.error('Failed to queue report generation task:', error);
    return null;
  }
}

/**
 * Добавить задачу обработки платежа в очередь
 */
export async function queuePaymentProcessing(
  paymentId: string,
  action: 'verify' | 'refund' | 'update_status'
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('queue_payment_processing', {
      p_payment_id: paymentId,
      p_action: action,
    });

    if (error) {
      logger.error('Error queueing payment processing task:', error);
      throw error;
    }

    logger.info('Payment processing task queued:', { paymentId, action, msgId: data });
    return data;
  } catch (error) {
    logger.error('Failed to queue payment processing task:', error);
    return null;
  }
}

// ============================================
// Функции для чтения задач из очередей (для обработчиков)
// ============================================

/**
 * Получить следующую задачу из очереди email
 * Используется обработчиками для получения задач
 */
export async function readEmailTask(timeoutSeconds: number = 30): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('pgmq_read', {
      queue_name: 'email_queue',
      vt: timeoutSeconds,
    });

    if (error) {
      logger.error('Error reading email task:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Failed to read email task:', error);
    return null;
  }
}

/**
 * Получить следующую задачу из очереди генерации отчетов
 */
export async function readReportGenerationTask(timeoutSeconds: number = 30): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('pgmq_read', {
      queue_name: 'report_generation_queue',
      vt: timeoutSeconds,
    });

    if (error) {
      logger.error('Error reading report generation task:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Failed to read report generation task:', error);
    return null;
  }
}

/**
 * Отметить задачу как выполненную
 */
export async function archiveTask(queueName: string, msgId: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('pgmq_archive', {
      queue_name: queueName,
      msg_id: msgId,
    });

    if (error) {
      logger.error('Error archiving task:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to archive task:', error);
    return false;
  }
}

/**
 * Вернуть задачу в очередь (если обработка не удалась)
 */
export async function returnTaskToQueue(queueName: string, msgId: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('pgmq_nack', {
      queue_name: queueName,
      msg_id: msgId,
    });

    if (error) {
      logger.error('Error returning task to queue:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to return task to queue:', error);
    return false;
  }
}

// ============================================
// Вспомогательные функции
// ============================================

/**
 * Получить статистику очереди
 */
export async function getQueueStats(queueName: string): Promise<{
  queue_length: number;
  newest_msg_age_sec: number;
  oldest_msg_age_sec: number;
  total_messages: number;
} | null> {
  try {
    const { data, error } = await supabase.rpc('pgmq_metrics', {
      queue_name: queueName,
    });

    if (error) {
      logger.error('Error getting queue stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    return null;
  }
}











