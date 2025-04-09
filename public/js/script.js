document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
});

let translationTimeout;
let lastTranslationAttempt = null;
const loadingIndicator = document.getElementById('loadingIndicator');
const statusText = document.getElementById('statusText');
const micButton = document.getElementById('micButton');
const speakSourceButton = document.getElementById('speakSourceButton');
const speakTranslatedButton = document.getElementById('speakTranslatedButton');
const connectionStatus = document.getElementById('connectionStatus');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
let recognition = null;

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

async function retryTranslation() {
    if (lastTranslationAttempt) {
        hideError();
        await translate();
    }
}

function initializeSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;

    if (window.SpeechRecognition) {
        recognition = new window.SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const sourceLanguage = document.getElementById('sourceLanguage')?.value || 'en-GB';
        recognition.lang = sourceLanguage;

        recognition.onstart = () => {
            micButton.classList.add('active');
            statusText.textContent = 'Listening... Please speak';
            statusText.style.color = '#34c759';
        };

        recognition.onresult = (event) => {
            try {
                const text = event.results[0][0].transcript;
                document.getElementById('sourceText').value = text;
                micButton.classList.remove('active');
                statusText.textContent = 'Speech detected, translating...';
                translate();
            } catch (error) {
                console.error('Speech recognition result error:', error);
                statusText.textContent = 'Error detecting speech. Please try again.';
                statusText.style.color = '#ff3b30';
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micButton.classList.remove('active');
            statusText.textContent = 'Speech recognition error. Please try again.';
            statusText.style.color = '#ff3b30';
        };

        recognition.onend = () => {
            micButton.classList.remove('active');
            if (statusText.textContent === 'Listening... Please speak') {
                statusText.textContent = '';
            }
        };

        return true;
    }
    return false;
}

function startSpeechRecognition() {
    try {
        if (!recognition) {
            initializeSpeechRecognition();
        }

        if (recognition) {
            if (micButton.classList.contains('active')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        }
    } catch (error) {
        console.error('Speech recognition error:', error);
        statusText.textContent = 'Error starting speech recognition. Please try again.';
        statusText.style.color = '#ff3b30';
    }
}

initializeSpeechRecognition();

micButton.addEventListener('click', startSpeechRecognition);

function speak(text, lang) {
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.onstart = () => {
                statusText.textContent = `Playing audio in ${languages[lang] || 'detected language'}...`;
                statusText.style.color = '#34c759';
            };
            utterance.onend = () => {
                statusText.textContent = '';
            };
            utterance.onerror = () => {
                statusText.textContent = 'Audio playback failed. Please try again.';
                statusText.style.color = '#ff3b30';
            };
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Text to speech error:', error);
            statusText.textContent = 'Audio playback failed. Please try again.';
            statusText.style.color = '#ff3b30';
        }
    }
}

function detectSourceLanguage(text) {
    const hasKorean = /[\uAC00-\uD7AF]/u.test(text);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/u.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/u.test(text);
    const hasCyrillic = /[\u0400-\u04FF]/u.test(text);
    const hasArabic = /[\u0600-\u06FF]/u.test(text);
    const hasThai = /[\u0E00-\u0E7F]/u.test(text);
    const hasGreek = /[\u0370-\u03FF]/u.test(text);
    const hasHebrew = /[\u0590-\u05FF]/u.test(text);
    const hasTurkish = /[ğĞıİşŞöÖüÜçÇ]/u.test(text);

    if (hasKorean) return 'ko-KR';
    if (hasJapanese) return 'ja-JP';
    if (hasChinese) return 'zh-CN';
    if (hasCyrillic) return 'ru-RU';
    if (hasArabic) return 'ar-SA';
    if (hasThai) return 'th-TH';
    if (hasGreek) return 'el-GR';
    if (hasHebrew) return 'he-IL';
    if (hasTurkish) return 'tr-TR';

    return 'en-GB';
}

speakSourceButton.addEventListener('click', () => {
    const text = document.getElementById('sourceText').value;
    if (text) {
        // First, try to detect the language
        const language = detectSourceLanguage(text);
        speak(text, language);
    } else {
        statusText.textContent = 'No text to read.';
        statusText.style.color = '#ff3b30';
    }
});

speakTranslatedButton.addEventListener('click', () => {
    const text = document.getElementById('translatedText').value;
    const targetLang = document.getElementById('targetLanguage').value;
    if (text) {
        const langCode = targetLang.toLowerCase().slice(0, 2) + '-' + targetLang.toUpperCase().slice(0, 2);
        speak(text, langCode);
    } else {
        statusText.textContent = 'No translation to read.';
        statusText.style.color = '#ff3b30';
    }
});

async function translate() {
    const sourceText = document.getElementById('sourceText').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const translatedTextArea = document.getElementById('translatedText');

    if (!sourceText) {
        loadingIndicator.classList.remove('visible');
        statusText.textContent = '';
        translatedTextArea.value = '';
        return;
    }

    lastTranslationAttempt = { sourceText, targetLanguage };
    loadingIndicator.classList.add('visible');
    statusText.textContent = 'Translation in progress...';
    hideError();

    try {
        const response = await fetch('http://localhost:3000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: sourceText,
                targetLanguage: targetLanguage
            })
        });

        if (!response.ok) {
            throw new Error('Translation service is currently unavailable. Please try again later.');
        }

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.error);
        }

        if (data.translation) {
            translatedTextArea.value = data.translation;
            statusText.textContent = 'Translation completed';
            statusText.style.color = '#34c759';
            setTimeout(() => {
                statusText.textContent = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Translation error:', error);
        translatedTextArea.value = '';
        showError(error.message || 'An error occurred during translation. Please try again.');
    }

    loadingIndicator.classList.remove('visible');
}

document.getElementById('sourceText').addEventListener('input', (e) => {
    loadingIndicator.classList.add('visible');
    statusText.textContent = 'Waiting for text...';
    hideError();

    clearTimeout(translationTimeout);
    translationTimeout = setTimeout(() => {
        if (e.target.value) {
            translate();
        } else {
            loadingIndicator.classList.remove('visible');
            statusText.textContent = '';
        }
    }, 800);
});

document.getElementById('targetLanguage').addEventListener('change', () => {
    const sourceText = document.getElementById('sourceText');
    if (sourceText.value) {
        translate();
    }
});

function openModal() {
    document.getElementById('apiModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('apiModal').style.display = 'none';
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }

    fetch('http://localhost:3000/update-api-key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('API key saved successfully!');
                closeModal();
            } else {
                alert('Error saving API key: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error saving API key');
            console.error('Error:', error);
        });
}

window.onclick = function (event) {
    if (event.target == document.getElementById('apiModal')) {
        closeModal();
    }
}