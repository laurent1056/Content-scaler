# Content Scaler — Video Pipeline Configurator

Content Scaler is a browser-based wizard that walks you through configuring an automated short-form video generation pipeline. In about two minutes you answer eight steps — project identity, spreadsheet layout, column mapping, branding, voice, image format, schedule — and the tool builds a complete `project.json` config file you can download immediately. No account required, no data leaves your browser.

## Python Backend

The generated `project.json` is consumed by [the-magisterium](https://github.com/laurent1056/the-magisterium), the Python backend that drives the actual video generation pipeline (image generation, ElevenLabs narration, FFmpeg assembly, and scheduling).

## How to Use

1. **Complete the wizard** at [https://laurent1056.github.io/Content-scaler](https://laurent1056.github.io/Content-scaler)
2. **Download `project.json`** using the button on the final step
3. **Place it in your project folder** alongside `generate_posts.py`
4. **Run the pipeline:**
   ```bash
   python3 generate_posts.py --project project.json
   ```

## Requirements

- Python 3.11+
- [ElevenLabs](https://elevenlabs.io) API key — for voice narration
- API key for your chosen image provider:
  - **Gemini (Google)** — free tier available via Google AI Studio
  - **Fal.ai Flux Pro** — highest image quality
  - **OpenAI DALL-E 3** — via OpenAI API

## File Structure

```
Content-scaler/
├── index.html    — App shell and script loading
├── style.css     — Dark theme, CSS custom properties, responsive layout
├── wizard.js     — Step logic, form handling, project.json builder
├── preview.js    — Live canvas rendering of the video frame
└── schema.js     — Defaults, validation rules, buildProjectJson()
```

## Local Development

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Deploying to GitHub Pages

Push to the `main` branch and enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / `/ (root)`). The site will be live at `https://<username>.github.io/Content-scaler/`.
