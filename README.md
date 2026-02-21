# Skill Manager

A CLI tool for managing Claude Code agent skills from a local repository. Easily copy skills to your current working directory with an interactive selection interface.
(created by vibe-coding)

## Installation

### From npm package (recommended)

```bash
npm install -g skill-manager-0.1.0.tgz
```

### From source

```bash
npm install
npm link
```

## Usage

```bash
# Run the skill manager
skill-manager

# Reconfigure repository path
skill-manager --reconfig

# Show help
skill-manager --help
```

## First Run

On first run, you'll be prompted to configure your skills repository path:

```
First-time setup: Please configure your skills repository path.
? Enter the path to your skills repository:
```

## Skills Repository Structure

Your local skills warehouse can be organized with categories:

```
skills-warehouse/
├── Development Tools/
│   ├── git-helper/
│   │   └── skill.md
│   └── docker-helper/
│       └── skill.md
├── Data Processing/
│   ├── csv-parser/
│   │   └── skill.md
│   └── json-tool/
│       └── skill.md
└── standalone/
    └── skill.md
```

Each skill directory must contain a `skill.md` file with the following format:

```markdown
name: Skill Display Name
description: Brief description of what this skill does

# Skill content here...

Instructions and prompts for the AI assistant.
```

## Output

Selected skills are copied to `.claude/skills/` in your current directory:

```
.claude/
└── skills/
    ├── git-helper/
    │   └── skill.md
    └── json-tool/
        └── skill.md
```

## Configuration

Configuration is stored at `~/.skill-manager/config.json`:

```json
{
  "repositoryPath": "/path/to/your/skills/warehouse"
}
```

Use `--reconfig` to clear and reconfigure.
