import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// DYNAMIC WEBSOCKET CONNECTION CALCULATOR
const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws';
  if (window.location.host.includes('localhost')) {
    return 'ws://localhost:3000/ws';
  }
  return `${protocol}//${window.location.host}/ws`;
};

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_BACKOFF = 1500; // 1.5 seconds backoff start
const PING_INTERVAL = 25000; // Keep alive check every 25 seconds

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  registerListener: (listener: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

/**
 * Global Enterprise WebSocket Provider
 * Ensures exactly ONE websocket connection is shared across all pages, 
 * shielding the server from redundant handshakes, socket leaks, or race conditions.
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());
  
  // Track last active timestamp to detect non-responsive silently dropped sockets (zombie connections)
  const lastActiveTimeRef = useRef<number>(Date.now());

  // Outstanding messages buffer for "WebSocket closed before opened" prevention
  const messageQueueRef = useRef<any[]>([]);

  // Register listener safely
  const registerListener = useCallback((listener: (data: any) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const connect = useCallback(() => {
    // Prevent duplicated connections while checking state
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('ℹ️ WebSocket already connected or connecting. Skipping duplicate handshake.');
      return;
    }

    const url = getWsUrl();
    console.log(`🔗 Initiating Singular Global WebSocket Connection to [${url}]`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket Connected Successfully');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      lastActiveTimeRef.current = Date.now();
      
      // Flush message queue if any messages were queued while connecting
      if (messageQueueRef.current.length > 0) {
        console.log(`📥 Flushing ${messageQueueRef.current.length} buffered messages from queue...`);
        const queue = [...messageQueueRef.current];
        messageQueueRef.current = [];
        queue.forEach((msg) => {
          try {
            ws.send(JSON.stringify(msg));
          } catch (err) {
            console.error('❌ Failed to send buffered message:', err);
          }
        });
      }

      // Initialize Heartbeat Ping to keep socket alive through Cloud Run / NGINX silent timeouts
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          // Check if socket is dead (zombie detection)
          const idleTime = Date.now() - lastActiveTimeRef.current;
          if (idleTime > PING_INTERVAL + 10000) {
            console.warn(`🛑 WebSocket non-responsive (zombie) for ${idleTime}ms. Terminating connection to trigger re-connection.`);
            ws.close(4001, "Heartbeat timeout");
            return;
          }
          
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      lastActiveTimeRef.current = Date.now();
      try {
        const data = JSON.parse(event.data);
        
        // Skip logs for ping-pong keepalives
        if (data && data.type === 'PONG') {
          return;
        }

        if (data && data.type !== 'PING') {
          console.log('📡 Realtime Payload Broadcasted to registered listeners:', data);
          // Broadcast to all active page hooks
          listenersRef.current.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              console.error('❌ Error executing registered listener callback:', err);
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ WebSocket message format invalid. Non-JSON payloads will be ignored:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket Communication Error:', error);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.warn(`⚠️ WebSocket Union Terminated [Code: ${event.code}, Clean: ${event.wasClean}, Reason: ${event.reason || "None"}]`);
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      // Ignore client intent closures (1000) or strict unmounts
      if (event.code !== 1000 && event.reason !== 'Component unmounted' && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const currentAttempt = reconnectAttemptsRef.current;
        const delay = Math.min(INITIAL_BACKOFF * Math.pow(1.8, currentAttempt), 25000);
        
        console.log(`🔄 Attempting automatic backoff reconnect in ${Math.round(delay)}ms (Attempt ${currentAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, delay);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      
      if (wsRef.current) {
        console.log('🧹 App root unmounted. Disposing global WebSocket socket clean.');
        wsRef.current.close(1000, 'App component context unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('⏳ WebSocket not fully ready. Buffering message in queue for delivery on connection maturation:', message);
      messageQueueRef.current.push(message);
    }
  }, []);

  return React.createElement(WebSocketContext.Provider, {
    value: { isConnected, sendMessage, registerListener }
  }, children);
};

/**
 * Page Hook `useWebSockets`
 * Automatically subscribes a listener function to the singular shared application socket,
 * bypassing component double renders & preserving live states beautifully.
 */
export const useWebSockets = (onMessage: (data: any) => void) => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSockets must be utilized within a stable <WebSocketProvider>. Add it to App.tsx.');
  }

  const { isConnected, sendMessage, registerListener } = context;
  const onMessageRef = useRef(onMessage);

  // Keep callback fresh without triggering unneeded re-subscriptions
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const unsubscribe = registerListener((data) => {
      onMessageRef.current(data);
    });
    return unsubscribe;
  }, [registerListener]);

  return { sendMessage, isConnected };
};

