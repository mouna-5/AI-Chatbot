package com.chatbot.demo;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.service.ChatService;
import com.chatbot.demo.service.GeminiService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;
    private final GeminiService geminiService;

    public ChatController(
            ChatService chatService,
            GeminiService geminiService) {

        this.chatService = chatService;
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public Message chat(@RequestParam(required = false) Long conversationId,
                        @RequestBody String message) {

        Conversation conversation;

        if (conversationId == null) {
            conversation = chatService.createConversation("New Chat");
        } else {
    conversation = chatService.getConversation(conversationId);
}

        // Save user's message
        chatService.saveMessage("USER", message, conversation);

        // Get AI response
        String aiResponse = geminiService.generateResponse(message);

        // Save AI response
        Message aiMessage =
                chatService.saveMessage("AI", aiResponse, conversation);

        return aiMessage;
    }
}