# VibeGen Project Knowledge

## Overview
VibeGen is a next-generation creative studio for generating high-fidelity images and videos using Google's **Gemini API**.
It features a premium, cinematic UI ("Open-Higgsfield-AI" style) and integrates state-of-the-art models:
- **Nano Banana Pro** (Gemini 3 Pro Image Preview) for professional image generation.
- **Veo 3.1** for high-fidelity video generation.

## Tech Stack
- **Frontend**: Vanilla JavaScript + Vite
- **Styling**: Tailwind CSS v4 (using CSS variables for theming)
- **API**: Google Gemini REST API (via `src/lib/gemini.js`)
- **State**: specialized stores or simple component state

## Architecture

### 1. API Layer (`src/lib/gemini.js`)
- **Client-Side REST**: Direct calls to `generativelanguage.googleapis.com` (proxied in dev via Vite).
- **Authentication**: Uses `gemini_api_key` stored in `localStorage`.
- **Image Generation**: Sync calls to `:generateContent` returning base64 images (converted to blob URLs).
- **Video Generation**: Async calls to `:generateVideos` with polling operations.

### 2. Core Components
- **ImageStudio**: Main interface for text-to-image. Features model picker, aspect ratio, and resolution controls.
- **VideoStudio**: Interface for text-to-video (Veo). Features duration controls and video player.
- **CinemaStudio**: Specialized "Cinematic" mode with camera/lens controls (8K, Anamorphic, etc.) powered by prompt engineering on top of Nano Banana Pro.

### 3. Models
Defined in `src/lib/models.js`.
- **Images**: `gemini-3-pro-image-preview` (Pro), `gemini-2.5-flash-image` (Fast)
- **Videos**: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`

## Development
- **Run**: `npm run dev`
- **Build**: `npm run build`
- **Proxy**: Configured in `vite.config.js` to route `/gemini-api` to Google.

## Key Decisions
- **Modality**: Moved from "Submit -> Poll" (Muapi) to Hybrid (Sync Images, Async Videos).
- **Storage**: History is stored in `localStorage` (`vibegen_image_history`, `cinema_history`).
- **Auth**: User provides their own API Key via `AuthModal`.
