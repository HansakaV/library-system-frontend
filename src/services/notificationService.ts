import type { NotificationData, NotificationResult, NotificationStats } from "../types";
import apiClient from "./apiClient";

/**
 * Send overdue notification to a single reader
 */
export const sendOverdueNotification = async (
  notificationData: NotificationData
): Promise<NotificationResult> => {
  try {
    console.log("Sending overdue notification with data:", notificationData);
    const response = await apiClient.post("/notifications/send-overdue", {
      to: notificationData.readerEmail,
      readerName: notificationData.readerName,
      subject: notificationData.subject,
      message: notificationData.message,
      overdueBooks: notificationData.overdueBooks
    });
    
    console.log("Response from sending notification:", response.data);
    
    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error: any) {
    console.error('Failed to send overdue notification:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error occurred while sending notification'
    };
  }
};

/**
 * Send bulk overdue notifications to multiple readers
 */
export const sendBulkOverdueNotifications = async (
  notifications: NotificationData[]
): Promise<NotificationResult[]> => {
  try {
    console.log("Sending bulk notifications for", notifications.length, "readers");
    const response = await apiClient.post("/notifications/send-bulk-overdue", {
      notifications: notifications.map(notification => ({
        to: notification.readerEmail,
        readerName: notification.readerName,
        subject: notification.subject,
        message: notification.message,
        overdueBooks: notification.overdueBooks
      }))
    });
    
    console.log("Response from bulk notifications:", response.data);
    
    return response.data.results || [];
  } catch (error: any) {
    console.error('Failed to send bulk notifications:', error);
    
    // If bulk request fails, return error for all notifications
    return notifications.map(() => ({
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error occurred while sending bulk notifications'
    }));
  }
};

/**
 * Send a test email to verify SendGrid configuration
 */
export const sendTestEmail = async (
  testEmail: string,
  testName: string = 'Test User'
): Promise<NotificationResult> => {
  try {
    console.log("Sending test email to:", testEmail);
    const response = await apiClient.post("/notifications/test", {
      to: testEmail,
      name: testName
    });
    
    console.log("Response from test email:", response.data);
    
    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error: any) {
    console.error('Failed to send test email:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error occurred while sending test email'
    };
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    console.log("Fetching notification statistics");
    const response = await apiClient.get("/notifications/stats");
    console.log("Response from notification stats:", response.data);
    
    // Map the response data to match our frontend types
    return {
      totalSent: response.data.data?.totalSent || 0,
      totalFailed: response.data.data?.totalFailed || 0,
      sentToday: response.data.data?.sentToday || 0,
      recentNotifications: (response.data.data?.recentNotifications || []).map((notification: any) => ({
        id: notification.id || notification._id,
        readerEmail: notification.readerEmail,
        readerName: notification.readerName,
        subject: notification.subject,
        status: notification.status,
        sentAt: notification.sentAt,
        errorMessage: notification.errorMessage
      }))
    };
  } catch (error: any) {
    console.error('Failed to fetch notification stats:', error);
    throw error;
  }
};

/**
 * Get notification history with pagination
 */
export const getNotificationHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  notifications: Array<{
    id: string;
    readerEmail: string;
    readerName: string;
    subject: string;
    bookTitles: string[];
    status: 'success' | 'failed';
    sentAt: string;
    errorMessage?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    console.log(`Fetching notification history - page: ${page}, limit: ${limit}`);
    const response = await apiClient.get(`/notifications/history?page=${page}&limit=${limit}`);
    console.log("Response from notification history:", response.data);
    
    return {
      notifications: (response.data.data?.notifications || []).map((notification: any) => ({
        id: notification.id || notification._id,
        readerEmail: notification.readerEmail,
        readerName: notification.readerName,
        subject: notification.subject,
        bookTitles: notification.bookTitles || [],
        status: notification.status === 'sent' ? 'success' : 'failed',
        sentAt: notification.sentAt,
        errorMessage: notification.errorMessage
      })),
      total: response.data.data?.total || 0,
      page: response.data.data?.page || 1,
      totalPages: response.data.data?.totalPages || 1
    };
  } catch (error: any) {
    console.error('Failed to fetch notification history:', error);
    throw error;
  }
};

/**
 * Delete notification from history
 */
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    console.log("Deleting notification with id:", id);
    await apiClient.delete(`/notifications/${id}`);
    console.log("Notification deleted successfully");
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

/**
 * Retry failed notification
 */
export const retryFailedNotification = async (id: string): Promise<NotificationResult> => {
  try {
    console.log("Retrying failed notification with id:", id);
    const response = await apiClient.post(`/notifications/retry/${id}`);
    console.log("Response from retry notification:", response.data);
    
    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error: any) {
    console.error('Failed to retry notification:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error occurred while retrying notification'
    };
  }
};