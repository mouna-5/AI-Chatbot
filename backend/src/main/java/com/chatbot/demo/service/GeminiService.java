package com.chatbot.demo.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private final Client client;

    public GeminiService() {
        this.client = new Client();
    }

    public String generateResponse(String message) {

        // Temporary fallback while Gemini API is unavailable
        return "I'm your AI assistant. Your message was received successfully! "
                + "Gemini AI integration is configured and will provide real AI "
                + "responses when the service is available.";
    }
}