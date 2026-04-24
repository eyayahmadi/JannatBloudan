import { WS_CONFIG } from '../config/api.config';

export enum WSEventType {
  ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED',
  TABLE_STATUS_UPDATED = 'TABLE_STATUS_UPDATED',
  RESERVATION_REMINDER = 'RESERVATION_REMINDER',
  NEW_ORDER = 'NEW_ORDER',
  KITCHEN_UPDATE = 'KITCHEN_UPDATE'
}

interface WSMessage {
  type: WSEventType;
  payload: any;
  timestamp: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<WSEventType, Set<(data: any) => void>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect(token: string) {
    if (typeof window === 'undefined') return;
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(`${WS_CONFIG.URL}?token=${token}`);

    this.socket.onopen = () => {
      console.log('[v0] WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.notifyListeners(message.type, message.payload);
      } catch (error) {
        console.error('[v0] Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('[v0] WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('[v0] WebSocket disconnected');
      this.attemptReconnect(token);
    };
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('[v0] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      console.log(`[v0] Attempting to reconnect (${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
      this.connect(token);
    }, WS_CONFIG.RECONNECT_DELAY);
  }

  subscribe(eventType: WSEventType, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  unsubscribe(eventType: WSEventType, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private notifyListeners(eventType: WSEventType, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  send(eventType: WSEventType, payload: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type: eventType,
        payload,
        timestamp: new Date().toISOString()
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('[v0] WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
