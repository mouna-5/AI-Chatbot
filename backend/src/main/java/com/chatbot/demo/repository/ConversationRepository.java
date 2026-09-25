package com.chatbot.demo.repository;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository
        extends JpaRepository<Conversation, Long> {

    List<Conversation> findAllByOrderByIdDesc();

    List<Conversation> findByUserOrderByIdDesc(User user);
}