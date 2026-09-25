package com.chatbot.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    @SuppressWarnings("unchecked")
    public String generateResponse(String message) {

        String systemPrompt = """
                You are Nova AI, a helpful, clear, and professional AI assistant.

                Formatting rules:
                1. Use clean Markdown for your responses.
                2. Use headings with #, ##, or ### when appropriate.
                3. Use **bold** for important terms.
                4. Use bullet points or numbered lists when useful.
                5. Use Markdown tables only when a table genuinely helps.
                6. For programming code, use fenced code blocks.
                7. Do not use HTML tags.
                8. Keep explanations easy to read and well structured.
                9. Answer the user's actual question directly.
                10. Do not add unnecessary sections.
                """;

        Map<String, Object> requestBody = Map.of(
                "model", "openai/gpt-oss-20b",

                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", systemPrompt
                        ),
                        Map.of(
                                "role", "user",
                                "content", message
                        )
                ),

                "include_reasoning", false
        );

        Map<String, Object> response = restClient.post()
                .uri("https://api.groq.com/openai/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> choices =
                (List<Map<String, Object>>) response.get("choices");

        Map<String, Object> firstChoice = choices.get(0);

        Map<String, Object> messageResponse =
                (Map<String, Object>) firstChoice.get("message");

        return (String) messageResponse.get("content");
    }


    @SuppressWarnings("unchecked")
    public String analyzeImage(
            MultipartFile image,
            String prompt) throws Exception {

        // Convert image into Base64
        String base64Image = Base64.getEncoder()
                .encodeToString(image.getBytes());

        // Determine image type
        String contentType = image.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IllegalArgumentException(
                    "Only image files are supported."
            );
        }

        // Create a data URL
        String imageDataUrl =
                "data:" + contentType +
                ";base64," + base64Image;


        String userPrompt =
                (prompt == null || prompt.isBlank())
                        ? "Describe this image in detail."
                        : prompt;


        Map<String, Object> userContent = Map.of(
                "type", "text",
                "text", userPrompt
        );


        Map<String, Object> imageContent = Map.of(
                "type", "image_url",
                "image_url", Map.of(
                        "url", imageDataUrl
                )
        );


        Map<String, Object> requestBody = Map.of(

                "model", "qwen/qwen3.8-27b",

                "messages", List.of(

                        Map.of(
                                "role", "user",
                                "content", List.of(
                                        userContent,
                                        imageContent
                                )
                        )

                ),

                "temperature", 0.7,

                "max_completion_tokens", 1024
        );


        Map<String, Object> response = restClient.post()
                .uri(
                        "https://api.groq.com/openai/v1/chat/completions"
                )
                .header(
                        "Authorization",
                        "Bearer " + apiKey
                )
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);


        List<Map<String, Object>> choices =
                (List<Map<String, Object>>)
                        response.get("choices");


        if (choices == null || choices.isEmpty()) {

            throw new RuntimeException(
                    "No response received from vision model."
            );
        }


        Map<String, Object> firstChoice =
                choices.get(0);


        Map<String, Object> messageResponse =
                (Map<String, Object>)
                        firstChoice.get("message");


        return (String)
                messageResponse.get("content");
    }
}