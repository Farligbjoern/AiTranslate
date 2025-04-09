# AiTranslate

A powerful translation application that supports 90+ languages using Google's Gemini AI technology. This application provides fast and accurate translations with a simple interface.

## Project Overview
- Supports 90+ languages
- Powered by Gemini AI
- Real-time translation
- Simple and intuitive interface

## Endpoints

### 1. Translation Endpoint
**POST** `/translate`

Translates text to the specified target language.

**Request Body:**
```json
{
  "text": "Text to translate",
  "targetLanguage": "Target language name"
}
```

**Response:**
```json
{
  "translation": "Translated text",
  "status": "success"
}
```

### 2. API Translation Endpoint
**GET** `/api/:language_code/:text`

Translates text using URL parameters.

**Parameters:**
- `language_code`: The target language code (e.g., "en", "es", "fr")
- `text`: URL-encoded text to translate

**Response:**
```json
{
  "success": true,
  "translation": "Translated text",
  "source_language": "tr-TR",
  "target_language": "target-language-code"
}
```

### 3. Health Check Endpoint
**GET** `/health`

Checks the API service status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO timestamp",
  "service": "AI Translation Service",
  "version": "1.0"
}
```

## Setup and Configuration

### Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=YOURAPIKEY
```

To get started:
1. Create a new file named `.env`
2. Add your Gemini API key using the format above
3. Replace `YOURAPIKEY` with your actual Gemini API key
4. Save the file in the project root directory

**Important:** Keep your API key secret and never share it publicly.

### Required Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000              # Optional, defaults to 3000
```

### Setting Up Environment Variables

1. Create a new file named `.env` in the project root directory
2. Add your Gemini API key to the file
3. Optionally configure the port (default is 3000)

Example `.env` file:
```env
GEMINI_API_KEY=AI8x9....your_actual_api_key....3kP2
PORT=3000
```

**Note:** Never commit your `.env` file to version control. Add it to `.gitignore`.

## Error Responses

The API may return the following error responses:

```json
{
  "error": "Error message",
  "errorType": "error_type",
  "status": "error"
}
```

Common error types:
- `timeout`: Request timeout
- `network`: Network connection issues
- `api_key`: API key related errors
- `unknown`: Other errors
