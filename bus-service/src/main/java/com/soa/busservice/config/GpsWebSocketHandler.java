package com.soa.busservice.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class GpsWebSocketHandler extends TextWebSocketHandler {
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) { sessions.add(session); }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { sessions.remove(session); }

    public void broadcast(String msg) {
        sessions.stream().filter(WebSocketSession::isOpen).forEach(s -> {
            try { s.sendMessage(new TextMessage(msg)); } catch (Exception e) {}
        });
    }
}