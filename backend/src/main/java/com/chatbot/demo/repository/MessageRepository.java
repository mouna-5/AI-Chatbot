package com.chatbot.demo.repository;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversation(Conversation conversation);
}