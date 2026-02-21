#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config path
const CONFIG_DIR = path.join(os.homedir(), '.skill-manager');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Claude Code skills directory
const CLAUDE_SKILLS_DIR = '.claude/skills';

/**
 * Load configuration
 */
async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
  } catch (error) {
    console.error(chalk.red('Failed to load config:'), error.message);
  }
  return null;
}

/**
 * Initialize configuration
 */
async function initConfig() {
  console.log(chalk.yellow('First-time setup: Please configure your skills repository path.'));

  const { repositoryPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'repositoryPath',
      message: 'Enter the path to your skills repository:',
      default: path.join(os.homedir(), 'skills-warehouse'),
      validate: async (input) => {
        const exists = await fs.pathExists(input);
        if (!exists) {
          return 'Path does not exist. Please create the directory first.';
        }
        return true;
      }
    }
  ]);

  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_FILE, { repositoryPath }, { spaces: 2 });

  console.log(chalk.green('Configuration saved!'));
  return { repositoryPath };
}

/**
 * Recursively scan directory for skills
 */
async function scanDirectory(dirPath, category = '', skills = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const skillMdPath = path.join(fullPath, 'skill.md');

        if (await fs.pathExists(skillMdPath)) {
          // This is a skill directory
          const content = await fs.readFile(skillMdPath, 'utf-8');
          const nameMatch = content.match(/^#?\s*name:\s*(.+)$/m);
          const descMatch = content.match(/^#?\s*description:\s*(.+)$/m);

          // Truncate description to 50 chars max
          let description = descMatch ? descMatch[1].trim() : 'No description';
          if (description.length > 50) {
            description = description.substring(0, 47) + '...';
          }

          skills.push({
            name: entry.name,
            displayName: nameMatch ? nameMatch[1].trim() : entry.name,
            description: description,
            category: category,
            path: fullPath
          });
        } else {
          // This is a category directory, recurse into it
          const newCategory = category ? path.join(category, entry.name) : entry.name;
          await scanDirectory(fullPath, newCategory, skills);
        }
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error scanning directory ${dirPath}:`), error.message);
  }

  return skills;
}

/**
 * Scan repository for available skills (with categories)
 */
async function scanSkills(repositoryPath) {
  return await scanDirectory(repositoryPath);
}

/**
 * Install selected skills
 */
async function installSkills(skills, targetDir) {
  const targetPath = path.join(targetDir, CLAUDE_SKILLS_DIR);
  await fs.ensureDir(targetPath);

  console.log(chalk.cyan(`\nInstalling ${skills.length} skill(s) to ${targetPath}...`));

  for (const skill of skills) {
    const targetSkillPath = path.join(targetPath, skill.name);

    // Remove existing skill directory if it exists
    if (await fs.pathExists(targetSkillPath)) {
      await fs.remove(targetSkillPath);
    }

    // Copy skill directory
    await fs.copy(skill.path, targetSkillPath);
    console.log(chalk.green(`✓ ${skill.displayName}`));
  }

  console.log(chalk.green('\nSkills installed successfully!'));
}

/**
 * Main CLI flow
 */
async function main() {
  console.log(chalk.cyan.bold('\n📦 Claude Code Skill Manager\n'));

  // Load or initialize config
  let config = await loadConfig();
  if (!config || !config.repositoryPath) {
    config = await initConfig();
  }

  // Validate repository path
  if (!(await fs.pathExists(config.repositoryPath))) {
    console.error(chalk.red(`Repository path does not exist: ${config.repositoryPath}`));
    console.log(chalk.yellow('Please reconfigure:'), chalk.cyan('skill-manager --reconfig'));
    process.exit(1);
  }

  // Scan for available skills
  console.log(chalk.dim(`Scanning repository: ${config.repositoryPath}`));
  const availableSkills = await scanSkills(config.repositoryPath);

  if (availableSkills.length === 0) {
    console.log(chalk.yellow('No skills found in repository.'));
    console.log(chalk.dim('Make sure each skill directory contains a skill.md file.'));
    process.exit(0);
  }

  console.log(chalk.green(`Found ${availableSkills.length} skill(s)\n`));

  // Group skills by category for display
  const skillsByCategory = {};
  for (const skill of availableSkills) {
    const category = skill.category || 'Uncategorized';
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skill);
  }

  // Build choices with category separators
  const choices = [];
  const sortedCategories = Object.keys(skillsByCategory).sort();

  for (const category of sortedCategories) {
    // Add category separator
    choices.push(new inquirer.Separator(`\n${chalk.bold.cyan('■ ' + category)}`));
    // Add skills in this category
    for (const skill of skillsByCategory[category]) {
      choices.push({
        name: `  ${chalk.bold.green(skill.displayName.padEnd(30))} ${chalk.dim(skill.description)}`,
        value: skill,
        short: skill.displayName
      });
    }
  }

  // Interactive selection
  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Select skills to install (use space to select, enter to confirm):',
      choices: choices,
      pageSize: 20,
      validate: (answer) => {
        if (answer.length === 0) {
          return 'Please select at least one skill.';
        }
        return true;
      }
    }
  ]);

  // Get current working directory as target
  const targetDir = process.cwd();

  // Install selected skills
  await installSkills(selectedSkills, targetDir);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--reconfig')) {
  fs.remove(CONFIG_FILE).then(() => {
    console.log(chalk.yellow('Configuration cleared. Please reconfigure.'));
    process.exit(0);
  });
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Skill Manager - Claude Code Skills Installer

Usage:
  skill-manager              Install skills from repository
  skill-manager --reconfig   Reconfigure repository path
  skill-manager --help       Show this help message
  `);
  process.exit(0);
} else {
  main().catch(error => {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  });
}
