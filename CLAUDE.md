# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js CLI tool for copying agent skills from a local repository (skills warehouse) to the current working directory. The tool is designed to work with Claude Code's skill system.

## Architecture

### Components

1. **Skill Repository Scanner** (`src/scanner.js`)
   - Reads the configured local skills directory
   - Lists all available skills with their metadata

2. **Interactive Selector** (`src/selector.js`)
   - Provides CLI interface for skill selection
   - Supports both single and multi-selection modes

3. **Skill Installer** (`src/installer.js`)
   - Creates Claude Code skill directory structure (`.claude/skills/`) if needed
   - Copies selected skills from repository to target directory

4. **Configuration** (`src/config.js`)
   - Manages path to local skills repository
   - Stores user preferences

### Configuration File

The tool uses `~/.skill-manager/config.json` for storing:
- `repositoryPath`: Path to local skills warehouse
- Other user preferences

## Development

```bash
# Install dependencies
npm install

# Run the CLI
npm start
# or
node src/index.js

# Run in development mode
npm run dev

# Build for distribution
npm run build

# Link globally for testing
npm link
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- scanner.test.js
```

## Claude Code Skills Directory Structure

```
.claude/
└── skills/
    └── skill-name/
        ├── skill.md
        └── (optional assets)
```

A valid skill must contain a `skill.md` file that defines the skill's behavior.
