# What If USA

An interactive Persona Explorer and Public Survey Simulator powered by the [NVIDIA Nemotron-Personas-USA](https://huggingface.co/datasets/nvidia/Nemotron-Personas-USA) dataset.

Ask any question and get real-time, AI-generated responses from a diverse sample of 3,120 synthetic American personas — each with unique demographics, occupations, education levels, and life backgrounds.

## Live Demo

[whatifusa.manus.space](https://whatifusa.manus.space)

## Features

**3D Terrain Map** — Full-screen MapLibre GL map with terrain elevation, hillshading, tilted perspective, and state-level sentiment choropleth visualization.

**AI-Powered Responses** — Each persona's answer is uniquely generated in real-time by an LLM based on their full demographic profile (age, sex, occupation, education, location, cultural background, career goals, hobbies).

**Progressive Wave Delivery** — Responses are generated in escalating batches (first 10, then 20, then the rest) with results streaming into the UI after each wave completes.

**Demographic Analysis Charts** — Age distribution histogram, education breakdown, occupation spread, and geographic distribution charts update live as results arrive.

**Audience Filters** — Filter by age range, sex, occupation, education level, state, and sample size to target specific demographic segments.

**Data Source Annotations** — NVIDIA Nemotron trust badges on every persona card and results panel for full provenance transparency.

**Liquid Glass UI** — Dark tactical command center aesthetic with frosted semi-transparent panels, backdrop-blur, gradient glow borders, and micro-animations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, MapLibre GL |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| AI | Forge LLM API (batch processing with structured JSON output) |
| Data | NVIDIA Nemotron-Personas-USA (3,120 stratified personas across 52 states) |
| Testing | Vitest (19 tests covering wave computation, response parsing, tRPC endpoints) |

## How It Works

1. **Ask a Question** — Type any policy, social, or economic question (or use a suggestion pill)
2. **Filter Your Audience** — Narrow by demographics, geography, or occupation
3. **Watch Waves Arrive** — First 10 responses appear quickly, then 20 more, then the rest
4. **Analyze Results** — View sentiment breakdown, demographic charts, state-level heatmap, and individual persona responses

## Dataset

This project uses the [NVIDIA Nemotron-Personas-USA](https://huggingface.co/datasets/nvidia/Nemotron-Personas-USA) dataset, which contains synthetically generated but demographically representative American personas. The dataset includes:

- 3,120 personas stratified across all 50 US states + DC and PR
- 358 unique occupations
- 7 education levels
- Rich biographical context (cultural background, hobbies, career goals, professional experience)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Environment Variables

The application requires the following environment variables (automatically configured in the Manus platform):

- `BUILT_IN_FORGE_API_URL` — LLM API endpoint
- `BUILT_IN_FORGE_API_KEY` — LLM API authentication key
- `DATABASE_URL` — MySQL/TiDB connection string

## License

MIT
