export interface MockNotification {
  _id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// In-memory store for notifications (mock for hackathon)
let notificationsStore: MockNotification[] = [];

export const getNotifications = (userId: string) => {
  return notificationsStore.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addNotification = (userId: string, message: string) => {
  const newNotif: MockNotification = {
    _id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    userId,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notificationsStore.push(newNotif);
  return newNotif;
};

export const markAsRead = (notificationId: string) => {
  const notif = notificationsStore.find(n => n._id === notificationId);
  if (notif) {
    notif.isRead = true;
  }
};

export const markAllAsRead = (userId: string) => {
  notificationsStore.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
};
