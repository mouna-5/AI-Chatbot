package com.chatbot.demo.service;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.repository.ConversationRepository;
import com.chatbot.demo.repository.MessageRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public ChatService(
            MessageRepository messageRepository,
            ConversationRepository conversationRepository) {

        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    public Conversation createConversation(String title) {

        Conversation conversation = new Conversation();
        conversation.setTitle(title);

        return conversationRepository.save(conversation);
    }

    public Conversation getConversation(Long id) {

        return conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    public Message saveMessage(
            String sender,
            String content,
            Conversation conversation) {

        Message message = new Message();

        message.setSender(sender);
        message.setContent(content);
        message.setConversation(conversation);

        return messageRepository.save(message);
    }
    public List<Message> getMessages(Conversation conversation) {
    return messageRepository.findByConversation(conversation);
}
}