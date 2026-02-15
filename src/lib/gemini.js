
export class GeminiClient {
    constructor() {
        this.baseUrl = import.meta.env.DEV ? '/gemini-api' : 'https://generativelanguage.googleapis.com';
    }

    getKey() {
        const key = localStorage.getItem('gemini_api_key');
        if (!key) throw new Error('Gemini API Key missing. Please set it in Settings.');
        return key;
    }

    // --- IMAGE GENERATION ---
    async generateImage(params) {
        const key = this.getKey();
        const model = params.model || 'gemini-3-pro-image-preview';
        const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${key}`;

        // Match the SDK's config structure for image generation
        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: params.prompt }]
            }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                imageConfig: {
                    aspectRatio: params.aspect_ratio || '1:1',
                    imageSize: params.image_size || '1K'
                }
            }
        };

        console.log('[Gemini] Generating Image:', model);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();

            // Find the image part in the response
            const parts = data.candidates?.[0]?.content?.parts || [];
            let imageUrl = null;
            let textResponse = '';

            for (const part of parts) {
                if (part.inlineData) {
                    const blobUrl = this.base64ToBlobUrl(
                        part.inlineData.data,
                        part.inlineData.mimeType || 'image/png'
                    );
                    imageUrl = blobUrl;
                } else if (part.text) {
                    textResponse += part.text;
                }
            }

            if (!imageUrl) {
                throw new Error('No image data received. Model response: ' + textResponse);
            }

            return {
                id: Date.now().toString(),
                url: imageUrl,
                text: textResponse,
                model: model,
                prompt: params.prompt
            };
        } catch (error) {
            console.error('[Gemini] Image Generation Failed:', error);
            throw error;
        }
    }


    // --- VIDEO GENERATION ---
    // Uses :generateVideos endpoint (not :predict)
    // SDK: ai.models.generateVideos({ model, source: { prompt }, config: { ... } })
    async generateVideo(params) {
        const key = this.getKey();
        const model = params.model || 'veo-3.1-generate-preview';
        const url = `${this.baseUrl}/v1beta/models/${model}:generateVideos?key=${key}`;

        const payload = {
            source: {
                prompt: params.prompt
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: params.aspect_ratio || '16:9',
                resolution: params.resolution || '720p',
                personGeneration: 'allow_adult',
                durationSeconds: parseInt(params.duration_seconds) || 8
            }
        };

        console.log('[Gemini] Requesting Video:', model, payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Veo Request Failed (${response.status}): ${errText}`);
            }

            const operation = await response.json();
            console.log('[Gemini] Operation started:', operation);

            return await this.pollForVideo(operation.name, key);

        } catch (error) {
            console.error('[Gemini] Video Generation Failed:', error);
            throw error;
        }
    }

    async pollForVideo(operationName, key, intervalMs = 10000) {
        // Poll URL: GET /v1beta/{operationName}?key=...
        const pollUrl = `${this.baseUrl}/v1beta/${operationName}?key=${key}`;

        while (true) {
            console.log('[Gemini] Polling video status...');
            const res = await fetch(pollUrl);
            if (!res.ok) throw new Error('Polling failed: ' + res.status);

            const op = await res.json();
            console.log('[Gemini] Poll result:', op);

            if (op.done) {
                if (op.error) {
                    throw new Error(`Video generation failed: ${op.error.message}`);
                }

                // SDK: operation.response.generatedVideos[0].video.uri
                const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;

                if (videoUri) {
                    return await this.downloadVideoFile(videoUri, key);
                }

                throw new Error('Video done but no URI found.');
            }

            await new Promise(r => setTimeout(r, intervalMs));
        }
    }

    async downloadVideoFile(uri, key) {
        try {
            // SDK pattern: fetch(`${videoUri}&key=${apiKey}`)
            // The URI from Veo already has query params, so use & not ?
            // In dev, proxy through Vite; in prod, use direct URL
            let fetchUrl;
            if (import.meta.env.DEV && uri.startsWith('https://generativelanguage.googleapis.com')) {
                // Rewrite to go through Vite proxy
                fetchUrl = uri.replace('https://generativelanguage.googleapis.com', '/gemini-api') + `&key=${key}`;
            } else {
                fetchUrl = `${uri}&key=${key}`;
            }

            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error('Failed to download video: ' + res.status);

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            return {
                url: blobUrl,
                originalUri: uri,
                id: Date.now().toString()
            };
        } catch (e) {
            console.error('Video download error:', e);
            throw e;
        }
    }

    base64ToBlobUrl(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return URL.createObjectURL(blob);
    }
}

export const gemini = new GeminiClient();
