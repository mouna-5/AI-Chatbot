package com.chatbot.demo.repository;

import com.chatbot.demo.entity.Message;
import com.chatbot.demo.entity.Conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository
        extends JpaRepository<Message, Long> {

    List<Message> findByConversation(
            Conversation conversation
    );

    @Modifying
    @Query(
        "DELETE FROM Message m " +
        "WHERE m.conversation.id = :conversationId"
    )
    void deleteByConversationId(
            @Param("conversationId")
            Long conversationId
    );
}