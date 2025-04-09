require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const app = express();
const languages = require('./languages.json');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
}));

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let genAI;
function initializeAI() {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
initializeAI();

const generationConfig = {
    temperature: 0.2,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

app.get('/', (req, res) => {
    res.render('index', { languages });
});
app.post('/translate', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig
        });
        const translationPromise = model.generateContent(`Translate the following text to ${targetLanguage}. Only provide the translation, nothing else: "${text}"`);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 10000);
        });
        try {
            const result = await Promise.race([translationPromise, timeoutPromise]);
            const translation = result.response.text();
            res.json({
                translation,
                status: 'success'
            });
        } catch (timeoutError) {
            if (timeoutError.message === 'TIMEOUT') {
                res.status(503).json({
                    error: 'Internet connection timeout',
                    errorType: 'timeout',
                    status: 'error'
                });
            } else {
                throw timeoutError;
            }
        }

    } catch (error) {
        console.error('Translation error:', error);
        let errorMessage = 'An error occurred during translation';
        let errorType = 'unknown';
        if (error.message && error.message.includes('network')) {
            errorMessage = 'Network connection error. Please check your connection and try again.';
            errorType = 'network';
        } else if (error.message && error.message.includes('API key')) {
            errorMessage = 'API key error. Please contact system administrator.';
            errorType = 'api_key';
        }
        res.status(500).json({
            error: errorMessage,
            errorType: errorType,
            status: 'error'
        });
    }
});

app.get('/api/:language_code/:text', async (req, res) => {
    try {
        const { language_code, text } = req.params;
        const decodedText = decodeURIComponent(text);
        const languageName = Object.entries(languages).find(([code]) => code === language_code)?.[1];
        if (!languageName) {
            return res.status(400).json({
                success: false,
                error: 'Invalid language code'
            });
        }
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig
        });
        const result = await model.generateContent(
            `Translate the following text to ${languageName}. Only provide the translation, nothing else: "${decodedText}"`
        );
        res.json({
            success: true,
            translation: result.response.text(),
            source_language: 'tr-TR',
            target_language: language_code
        });
    } catch (error) {
        console.error('API translation error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during translation'
        });
    }
});
app.get('/health', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AI Translation Service',
        version: '1.0'
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});