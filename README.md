# Pronunciation Analyzer

Upload an English speech recording and receive AI-powered pronunciation feedback, confidence analysis, and actionable improvement suggestions.

**Live URL:** [livo-amber.vercel.app](https://livo-amber.vercel.app/)

---

## How It Works

1. **Record or upload** 30–45 seconds of English speech via the browser (MediaRecorder API or file upload).
2. **Deepgram Nova-2** transcribes the audio with per-word confidence scores and timestamps.
3. **Scoring engine** classifies each word, measures speech rate, pause consistency, and filler word ratio, then produces a weighted overall score.
4. **Groq Llama 3.3-70b** generates hedged, human-readable explanations for flagged words (only if needed — clean audio skips the LLM call entirely).
5. **Results** are displayed as an interactive dashboard: score card with ring gauge, color-coded transcript, flagged words panel, stats cards, and improvement recommendations.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 | Server-rendered UI with client interactions |
| STT | Deepgram Nova-2 | Word-level confidence + timestamps |
| LLM | Groq Llama 3.3-70b | Hedged feedback generation |
| Hosting | Vercel (Hobby tier) | Serverless deployment |
| Icons | Lucide React | UI iconography |
| Animations | Framer Motion | Staggered word appear, count-up score |

**No database.** Audio is held in memory during the request and discarded immediately after processing. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full rationale.

---

## Architecture

Detailed system design, including the Mermaid flow diagram, model comparisons, scoring methodology, DPDP compliance, and trade-off analysis are documented in **[ARCHITECTURE.md](./ARCHITECTURE.md)** .

Key design decisions:
- Conditional LLM call — Groq is skipped when the transcript has no flagged words, keeping median latency ~5–6s
- Confidence-based scoring over phoneme alignment — Deepgram's per-word confidence is a proxy signal, not ground-truth pronunciation measurement (documented honestly)
- Zero persistent storage — deliberate choice for privacy and deployment simplicity

---

## Environment Variables

```env
DEEPGRAM_API_KEY=your_deepgram_api_key
GROQ_API_KEY=your_groq_api_key
```

Copy `.env.example` to `.env.local` for local development. Set both variables in your Vercel dashboard for production.

---

## Running Locally

```bash
git clone <repo-url>
cd livo
npm install
cp .env.example .env.local   # add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

Ensure `DEEPGRAM_API_KEY` and `GROQ_API_KEY` are set in the Vercel project's environment variables.

---

## Limitations

- **Confidence ≠ pronunciation.** Scoring is based on STT recognition confidence, not phoneme-level analysis. Background noise, mic quality, and accent can affect scores independently of actual pronunciation.
- **English only.** The STT model and scoring logic are configured for English speech.
- **No user accounts.** Each session is standalone. Progress tracking requires additional infrastructure.
- **In-memory rate limiting.** Rate limit resets on cold starts. See [ARCHITECTURE.md](./ARCHITECTURE.md) for production alternatives.

---

Built with [Deepgram](https://deepgram.com), [Groq](https://groq.com), [Next.js](https://nextjs.org), and [Vercel](https://vercel.com).
