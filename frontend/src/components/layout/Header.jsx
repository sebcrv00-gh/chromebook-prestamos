import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiClient from '../../services/api';
import { Bell, LogOut, User, Check, AlertCircle } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await ApiClient.get('/notifications?limit=10');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // silent catch for unauthenticated states
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await ApiClient.patch(`/notifications/${id}/read`, {});
      fetchNotifications();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.patch('/notifications/read-all', {});
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <header style={styles.header}>
      <div></div>

      <div style={styles.rightSection}>
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={styles.iconBtn}
            title="Notificaciones"
          >
            <Bell size={20} color="var(--color-gray-700)" />
            {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notificaciones</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={styles.textBtn}>
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div style={styles.dropdownBody}>
                {notifications.length === 0 ? (
                  <p style={styles.emptyText}>No tienes notificaciones</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        ...styles.notificationItem,
                        backgroundColor: n.read ? 'var(--color-white)' : 'var(--color-red-50)',
                      }}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                    >
                      <div style={styles.notifHeader}>
                        <span style={styles.notifTitle}>{n.title}</span>
                        {!n.read && <span style={styles.dot}></span>}
                      </div>
                      <p style={styles.notifMessage}>{n.message}</p>
                      <span style={styles.notifTime}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            <User size={18} color="var(--color-gray-700)" />
          </div>
          <div>
            <p style={styles.userName}>{user?.firstName} {user?.lastName}</p>
            <p style={styles.userRole}>{user?.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={logout} style={styles.logoutBtn} title="Cerrar Sesión">
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: 'var(--header-height)',
    position: 'fixed',
    top: 0,
    right: 0,
    left: 'var(--sidebar-width)',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    zIndex: 90,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  iconBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
  },
  unreadBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-white)',
    fontSize: '0.65rem',
    fontWeight: '700',
    borderRadius: 'var(--radius-full)',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    width: '320px',
    maxHeight: '400px',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    zIndex: 200,
  },
  dropdownHeader: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-gray-50)',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dropdownBody: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  emptyText: {
    padding: '1.5rem',
    textAlign: 'center',
    color: 'var(--color-gray-400)',
    fontSize: '0.875rem',
  },
  notificationItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-gray-900)',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
  },
  notifMessage: {
    fontSize: '0.75rem',
    color: 'var(--color-gray-600)',
    marginTop: '0.25rem',
  },
  notifTime: {
    fontSize: '0.65rem',
    color: 'var(--color-gray-400)',
    marginTop: '0.25rem',
    display: 'block',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-gray-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-gray-900)',
    lineHeight: '1.2',
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--color-gray-500)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    background: 'none',
    border: '1px solid var(--color-gray-300)',
    padding: '0.4rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-gray-700)',
    cursor: 'pointer',
  },
};
