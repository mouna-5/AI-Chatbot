package com.chatbot.demo;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.entity.User;

import com.chatbot.demo.repository.ConversationRepository;
import com.chatbot.demo.repository.UserRepository;

import com.chatbot.demo.service.ChatService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@CrossOrigin(origins = "http://localhost:5173")
public class ConversationController {

    private final ChatService chatService;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public ConversationController(
            ChatService chatService,
            ConversationRepository conversationRepository,
            UserRepository userRepository) {

        this.chatService = chatService;
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

    @GetMapping
    public List<Conversation> getAllConversations() {

        User currentUser = getCurrentUser();

        return conversationRepository
                .findByUserOrderByIdDesc(
                        currentUser
                );
    }

    @GetMapping("/{id}/messages")
    public List<Message> getMessages(
            @PathVariable Long id) {

        Conversation conversation =
                chatService.getConversation(id);

        return chatService.getMessages(
                conversation
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable Long id) {

        try {

            chatService.deleteConversation(id);

            return ResponseEntity.ok(
                    "Conversation deleted successfully"
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            "Delete failed: "
                                    + e.getMessage()
                    );
        }
    }
}