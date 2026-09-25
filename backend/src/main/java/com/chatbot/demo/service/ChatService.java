package com.chatbot.demo.service;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.entity.User;

import com.chatbot.demo.repository.ConversationRepository;
import com.chatbot.demo.repository.MessageRepository;
import com.chatbot.demo.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public ChatService(
            MessageRepository messageRepository,
            ConversationRepository conversationRepository,
            UserRepository userRepository) {

        this.messageRepository = messageRepository;
        this.conversationRepository =
                conversationRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated"
            );
        }

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
                                "User not found"
                        )
                );
    }

    public Conversation createConversation(
            String title) {

        User currentUser = getCurrentUser();

        Conversation conversation =
                new Conversation();

        conversation.setTitle(title);
        conversation.setUser(currentUser);

        return conversationRepository.save(
                conversation
        );
    }

    public Conversation getConversation(
            Long id) {

        Conversation conversation =
                conversationRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Conversation not found: "
                                                + id
                                )
                        );

        User currentUser = getCurrentUser();

        if (!conversation.getUser()
                .getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You do not have access to this conversation"
            );
        }

        return conversation;
    }

    public Message saveMessage(
            String sender,
            String content,
            Conversation conversation) {

        Message message =
                new Message();

        message.setSender(sender);
        message.setContent(content);
        message.setConversation(conversation);

        return messageRepository.save(
                message
        );
    }

    public List<Message> getMessages(
            Conversation conversation) {

        return messageRepository
                .findByConversation(conversation);
    }

    @Transactional
    public void deleteConversation(
            Long conversationId) {

        Conversation conversation =
                getConversation(conversationId);

        messageRepository.deleteByConversationId(
                conversationId
        );

        conversationRepository.delete(
                conversation
        );
    }
}