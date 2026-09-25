package com.chatbot.demo;

import com.chatbot.demo.entity.Conversation;
import com.chatbot.demo.entity.Message;
import com.chatbot.demo.service.ChatService;
import com.chatbot.demo.service.GroqService;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;
    private final GroqService groqService;

    public ChatController(
            ChatService chatService,
            GroqService groqService) {

        this.chatService = chatService;
        this.groqService = groqService;
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(
            @RequestParam(required = false)
            Long conversationId,

            @RequestBody
            String message) {

        Conversation conversation;

        if (conversationId == null) {

            String title = createTitle(message);

            conversation =
                    chatService.createConversation(title);

        } else {

            conversation =
                    chatService.getConversation(
                            conversationId
                    );
        }

        chatService.saveMessage(
                "USER",
                message,
                conversation
        );

        String aiResponse =
                groqService.generateResponse(message);

        Message aiMessage =
                chatService.saveMessage(
                        "AI",
                        aiResponse,
                        conversation
                );

        return createResponse(
                aiMessage,
                conversation
        );
    }


    @PostMapping(
            value = "/chat/image",
            consumes = "multipart/form-data"
    )
    public Map<String, Object> analyzeImage(

            @RequestParam("image")
            MultipartFile image,

            @RequestParam(
                    value = "message",
                    required = false
            )
            String message,

            @RequestParam(
                    value = "conversationId",
                    required = false
            )
            Long conversationId

    ) throws Exception {

        Conversation conversation;

        String userPrompt =
                (message == null ||
                        message.isBlank())

                        ? "Describe this image in detail."

                        : message;


        if (conversationId == null) {

            String title =
                    createTitle(userPrompt);

            conversation =
                    chatService.createConversation(
                            title
                    );

        } else {

            conversation =
                    chatService.getConversation(
                            conversationId
                    );
        }


        chatService.saveMessage(
                "USER",
                userPrompt,
                conversation
        );


        String aiResponse =
                groqService.analyzeImage(
                        image,
                        userPrompt
                );


        Message aiMessage =
                chatService.saveMessage(
                        "AI",
                        aiResponse,
                        conversation
                );


        return createResponse(
                aiMessage,
                conversation
        );
    }


    private String createTitle(String message) {

        if (message == null ||
                message.isBlank()) {

            return "New Conversation";
        }

        String cleanedMessage =
                message
                        .replaceAll("\\s+", " ")
                        .trim();

        if (cleanedMessage.length() <= 35) {
            return cleanedMessage;
        }

        return cleanedMessage.substring(0, 35)
                .trim()
                + "...";
    }


    private Map<String, Object> createResponse(
            Message message,
            Conversation conversation) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "id",
                message.getId()
        );

        response.put(
                "sender",
                message.getSender()
        );

        response.put(
                "content",
                message.getContent()
        );

        response.put(
                "conversationId",
                conversation.getId()
        );

        response.put(
                "conversationTitle",
                conversation.getTitle()
        );

        return response;
    }
}