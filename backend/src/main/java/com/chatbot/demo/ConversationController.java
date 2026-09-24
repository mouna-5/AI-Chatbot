package com.chatbot.demo;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ChatService chatService;

    public ConversationController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/{id}/messages")
    public List<Message> getMessages(@PathVariable Long id) {

        Conversation conversation = chatService.getConversation(id);

        return chatService.getMessages(conversation);
    }
}