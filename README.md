<h3 align="center">
  <img src="public/t0-logo-bg.svg" width="80" alt="Text0 Logo"/>
  <img src="https://raw.githubusercontent.com/crafter-station/website/main/public/transparent.png" height="30" width="0px"/>
  <br/>
  Text0
  <br/>
  <br/>
  <a href="https://discord.gg/HZA8zwNr9v" target="_blank">
    <img src="https://img.shields.io/badge/Join%20Our%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Join Discord"/>
  </a>
  <br/>
    <a href="https://crafter-station.com" target="_blank" >
    <span style="color: #888; text-decoration: none; font-size: 12px;">
      by Crafter Station
    </span>
    </a>
</h3>

# Text0

A text editor with absurdly smart autocomplete. Text0 serves as a copilot for writing, accessing user-provided references to offer context and help users write faster.

![Text0 Screenshot](./public/autocomplete.png)

## Features

- Smart autocomplete powered by AI
- Chat with your content 
- Reference-aware suggestions
- Github, Linear and Notion integrations
- Seamless writing experience
- Voice input and output
- Zen mode

## Tech Stack

- React
- Next.js
- Tailwind CSS
- RadixUI
- Upstash Redis
- Upstash Vector
- AI SDK
- UploadThing
- Cursor
- Vercel
- Trigger.dev
- Clerk (Authentication)

## Getting Started

### Prerequisites

- Node.js
- Bun (preferred)

### Installation

```bash
# Clone the repository
git clone https://github.com/crafter-station/text0.git
cd text0

# Install dependencies
bun install

# Start the development server
bun dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values below. The
application needs the required services to boot and serve requests.

| Variable | Required | Where to get it | What breaks without it |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Yes | [Clerk Dashboard](https://dashboard.clerk.com) | Authentication and protected routes fail |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | [Clerk Dashboard](https://dashboard.clerk.com) | Clerk cannot initialize in the browser |
| `UPSTASH_REDIS_REST_URL` | Yes | [Upstash Console](https://console.upstash.com) | Redis-backed docs and state fail |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | [Upstash Console](https://console.upstash.com) | Redis-backed docs and state fail |
| `UPSTASH_VECTOR_REST_URL` | Yes | [Upstash Console](https://console.upstash.com) | Vector-backed autocomplete fails |
| `UPSTASH_VECTOR_REST_TOKEN` | Yes | [Upstash Console](https://console.upstash.com) | Vector-backed autocomplete fails |
| `UPLOADTHING_TOKEN` | Yes | [UploadThing](https://uploadthing.com) | File uploads fail |
| `TRIGGER_SECRET_KEY` | Yes | [Trigger.dev](https://trigger.dev) | Background jobs cannot run |
| `TRIGGER_PROJECT_ID` | Yes | [Trigger.dev](https://trigger.dev) | Background jobs cannot run |
| `NEXT_PUBLIC_APP_URL` | Yes | Your local or deployed origin | Redirects and upload callbacks use the wrong URL |

Optional model providers:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY` | Model providers used by the AI SDK |
| `MINIMAX_API_KEY`, `MINIMAX_API_FORMAT`, `MINIMAX_BASE_URL` | MiniMax provider |
| `OLLAMA_BASE_URL`, `OLLAMA_UTILITY_MODEL` | Local Ollama models |
| `FIRECRAWL_API_KEY` | Web reference crawling |
| `ELEVENLABS_API_KEY` | Voice output |
| `DEFAULT_USER_ID` | Local development fallback identity |

## Usage

Visit [www.text0.dev](https://www.text0.dev) to access the hosted version.

To use the local development version, navigate to `http://localhost:3000` after starting the development server.

## Screenshots

![Landing](./public/landing.png)
![Autocomplete](./public/autocomplete.png)
![File navigation](./public/home.png)

## Contributing

Contributions are welcome! Please feel free to:

1. Open issues for bugs or feature requests
2. Submit PRs for new functionality
3. Fork the project for your own use

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- [Railly Hugo](https://github.com/Railly)
- [Anthony Cueva](https://github.com/cuevaio)
