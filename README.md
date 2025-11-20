# AI Planner: Structured Code Generation and Prompt Engineering UI

The AI Planner provides a powerful web interface to turn natural-language developer requests into structured, executable code plans. It also features a dedicated LLM Prompt Generator to assist in creating highly constrained system prompts for custom AI tasks. Built with TypeScript, a React + Vite frontend, and a Node/NestJS backend, it streamlines the process of generating, reviewing, and applying code changes safely.

- Repository: evillan0315/ai-planner
- Primary language: TypeScript

---

## Quick Overview

AI Planner UI provides two main tools:

1. **AI Code Planner:** Accepts developer instructions, analyzes project context, and generates structured, executable code plans (unified diffs, new file content, build scripts, git commands).
2. **LLM Prompt Generator:** A dedicated tool for composing and validating complex, schema-enforced system prompts used for planning and custom generation tasks.

Watch a short demo: https://youtu.be/Lcls1s0MJV0

Screenshots used in documentation are stored locally here:
`/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/screens`

For architecture details see docs/OVERVIEW_ARCHITECTURE.md.

---

## Table of Contents

- [Features](#features)