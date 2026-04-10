---
name: mempalace
description: MemPalace — search, mine, and manage persistent memory for OpenCode sessions. Use when asked about mempalace, memory palace, mining memories, searching memories, or palace setup.
---

# MemPalace

A searchable memory palace for AI. Use it to mine projects and conversations, then search them semantically.

## Prerequisites

First verify MemPalace is available:

```bash
mempalace --version
```

If that fails, try:

```bash
python3 -m mempalace --version
```

## Usage

MemPalace exposes dynamic instructions via the CLI. For any MemPalace task, first run:

```bash
mempalace instructions <command>
```

Where `<command>` is one of:

- `help`
- `init`
- `mine`
- `search`
- `status`

If the `mempalace` command is unavailable, use:

```bash
python3 -m mempalace instructions <command>
```

Follow the returned instructions step by step.

## OpenCode Notes

This environment may also have:

- the `mempalace` MCP server for direct palace tools
- the `opencode-mempalace` plugin for automatic transcript export and save

Prefer:

- `instructions search` for user-facing memory lookup workflows
- `instructions mine` for importing projects or conversations
- MCP tools when direct structured memory operations are needed
