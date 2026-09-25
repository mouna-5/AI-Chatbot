package com.chatbot.demo;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.repository.MessageRepository;
import com.chatbot.demo.service.ChatService;
import com.chatbot.demo.service.GroqService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/chat")
public class RegenerateController {

    private final ChatService chatService;
    private final GroqService groqService;
    private final MessageRepository messageRepository;

    public RegenerateController(
            ChatService chatService,
            GroqService groqService,
            MessageRepository messageRepository) {

        this.chatService = chatService;
        this.groqService = groqService;
        this.messageRepository = messageRepository;
    }

    @PostMapping("/regenerate")
    public Message regenerate(
            @RequestParam Long conversationId) {

        Conversation conversation =
                chatService.getConversation(
                        conversationId
                );

        List<Message> messages =
                chatService.getMessages(
                        conversation
                );

        Message lastUserMessage = null;
        Message lastAIMessage = null;

        for (int i = messages.size() - 1; i >= 0; i--) {

            Message current = messages.get(i);

            if (lastAIMessage == null &&
                    "AI".equals(current.getSender())) {

                lastAIMessage = current;
            }

            if (lastUserMessage == null &&
                    "USER".equals(current.getSender())) {

                lastUserMessage = current;
                break;
            }
        }

        if (lastUserMessage == null) {

            throw new RuntimeException(
                    "No user message found to regenerate."
            );
        }

        String newResponse =
                groqService.generateResponse(
                        lastUserMessage.getContent()
                );

        // Delete the previous AI response only
        // after the new response has been generated.
        if (lastAIMessage != null) {
            messageRepository.delete(
                    lastAIMessage
            );
        }

        return chatService.saveMessage(
                "AI",
                newResponse,
                conversation
        );
    }
}
