# Bee Agent

A sophisticated conversational AI agent powered by the beeai-framework, featuring a two-tier agent system for handling both simple and complex queries.

## Features

- Two-tier agent architecture:
  - Simple Agent: Handles basic conversational queries
  - Complex Agent: Manages sophisticated tasks using external tools
- Built-in tools integration:
  - Wikipedia searches
  - Weather information (via OpenMeteo)
  - Web searches (via DuckDuckGo)
- Interactive console interface
- Memory system for conversation context
- Response quality evaluation system

## Prerequisites

- Node.js (Latest LTS version recommended)
- [Ollama](https://ollama.ai/) installed and running locally

## Installation

1. Clone this repository

2. Install dependencies:

    ```bash
    npm install
    ```

3. Configure environment variables:
   - Copy `.env.template` to `.env`
   - Modify values in `.env` as needed
   - By default, the agent uses the `granite3.1-dense` Ollama model, but you can change this by setting `LLM_MODEL`

    ```env
    LLM_MODEL=granite3.1-dense  # or your preferred Ollama model
    ```

## Usage

### Development Mode

Run the project in development mode with hot reloading:

```bash
npm run dev
```

### Production Mode

Build and run the project in production mode:

```bash
npm run start
```

### Interacting with the Agent

- Start a conversation by typing your message after the user prompt
- Use 'q' to exit the interactive session
- The agent will automatically determine whether to use the simple or complex agent based on query complexity

## Project Structure

- `bee-workflow.ts` - Main application entry point and workflow definition
- `utils/io.ts` - Console I/O utilities and interface management
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Technical Details

### Workflow Steps

1. **Simple Agent**: Handles basic queries without external tools
2. **Critique**: Evaluates response quality (0-100 score)
3. **Complex Agent**: Activated for complex queries (score < 75) with tool integration

### Memory System

Uses `UnconstrainedMemory` for maintaining conversation context and history.

## Dependencies

- `beeai-framework`: Core framework for AI agent capabilities
- `dotenv`: Environment variable management
- `picocolors`: Console output styling
- `typescript`: Development language
- `ts-node`: TypeScript execution environment

## Development

### Building the Project

```bash
npm run build
```

### Type Checking

The project uses strict TypeScript configuration for type safety.

## License

[Your License Here]
