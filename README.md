# opencode-mempalace

OpenCode plugin for [MemPalace](https://github.com/milla-jovovich/mempalace).

Give your OpenCode sessions **permanent memory**. Your AI will remember conversations, decisions, and context across sessions — automatically.

If you use OpenCode with an agent, you can give it this README and ask it to install or uninstall the full MemPalace setup automatically using the agent sections below.

Example prompt:

```text
Install the OpenCode MemPalace plugin and optional skill from this repo: https://github.com/victornor/opencode-mempalace/blob/main/README.md
```

## Features

- **Idle Checkpoint Saves**: Counts `session.idle` events and saves every N assistant responses
- **Pre-Compaction Save**: Saves before OpenCode compacts session context
- **OpenCode-Native Export**: Reads OpenCode sessions from `~/.local/share/opencode/opencode.db`
- **Transcript Export**: Writes markdown transcripts to `~/chats/opencode/`
- **Local Workflow**: Runs `mempalace mine` locally with your existing MemPalace install
- **Close-Path Saves**: Saves on interval checkpoints, compaction, and session/server disposal events
- **Optional Skill**: Includes an OpenCode skill for guided MemPalace workflows

## Prerequisites

- Python 3.9+
- [MemPalace](https://github.com/milla-jovovich/mempalace) installed

## Setup

<details>
<summary>INSTALL INSTRUCTIONS (FOR AGENTS)</summary>

Use these steps when asked to fully install MemPalace for OpenCode.

1. Install MemPalace globally.

```bash
pip install mempalace
```

If the machine uses a PEP 668-managed Python environment, use:

```bash
python3 -m pip install --user --break-system-packages mempalace
```

2. Ensure the MemPalace CLI is on `PATH`.

If installed into `~/.local/bin`, add that directory to the shell `PATH`.

3. Initialize MemPalace.

```bash
mempalace init ~/projects/myapp
```

4. Clone this plugin repository.

```bash
git clone https://github.com/victornor/opencode-mempalace.git ~/git/opencode-mempalace
```

5. Install plugin dependencies and build it.

```bash
cd ~/git/opencode-mempalace
bun install
bun run build
```

6. Configure OpenCode to load the plugin.

Edit `~/.config/opencode/opencode.json` and ensure it contains:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/home/<user>/git/opencode-mempalace"]
}
```

If the file already exists, merge this into the existing config instead of overwriting unrelated settings.

7. Optionally configure the MemPalace MCP server in the same `opencode.json`.

```json
{
  "mcp": {
    "mempalace": {
      "type": "local",
      "command": ["python3", "-m", "mempalace.mcp_server"],
      "enabled": true
    }
  }
}
```

8. Optionally install the OpenCode skill.

```bash
mkdir -p ~/.opencode/skills/mempalace
cp ~/git/opencode-mempalace/skills/mempalace/SKILL.md ~/.opencode/skills/mempalace/SKILL.md
```

9. Configure environment variables in the user's shell profile.

Required or recommended:

```bash
export MEMPAL_CONVOS_DIR=~/chats
export MEMPALACE_SAVE_INTERVAL=15
export MEMPALACE_DEBUG=1
export OPENCODE_DB_PATH=~/.local/share/opencode/opencode.db
```

Optional override if MemPalace is not available via the default Python:

```bash
export MEMPALACE_PYTHON=/path/to/python3
```

10. Create the transcript export directory.

```bash
mkdir -p ~/chats/opencode
```

11. Reload the shell configuration or start a new shell.

12. Restart OpenCode.

13. Verify installation.

```bash
mempalace status
tail -50 /tmp/opencode-mempalace.log
```

14. Verify the plugin path works by sending a few prompts in OpenCode, then check:

```bash
ls -la ~/chats/opencode
mempalace search "some phrase from a recent conversation"
```

</details>

<details>
<summary>UNINSTALL INSTRUCTIONS (FOR AGENTS)</summary>

Use these steps when asked to remove the full MemPalace OpenCode setup.

1. Remove the plugin from `~/.config/opencode/opencode.json`.

Delete the plugin entry pointing to `opencode-mempalace`.

2. Optionally remove the MemPalace MCP server entry from `~/.config/opencode/opencode.json`.

Delete the `mempalace` item from the `mcp` section if it was added for this integration.

3. Remove the optional skill.

```bash
rm -rf ~/.opencode/skills/mempalace
```

4. Remove MemPalace-related shell environment variables from the user's shell profile.

Delete entries such as:

```bash
export MEMPAL_CONVOS_DIR=~/chats
export MEMPALACE_SAVE_INTERVAL=15
export MEMPALACE_DEBUG=1
export OPENCODE_DB_PATH=~/.local/share/opencode/opencode.db
export MEMPALACE_PYTHON=/path/to/python3
```

5. Remove the plugin repository clone if desired.

```bash
rm -rf ~/git/opencode-mempalace
```

6. Remove exported OpenCode transcripts if desired.

```bash
rm -rf ~/chats/opencode
```

7. Remove the debug log if desired.

```bash
rm -f /tmp/opencode-mempalace.log
```

8. Optionally uninstall MemPalace itself.

If it was installed with pip:

```bash
python3 -m pip uninstall mempalace
```

If it was installed with `--user --break-system-packages`, use the same Python environment to uninstall it.

9. Restart OpenCode and the shell session.

</details>

### 1. Install MemPalace

```bash
# Install globally with pip
pip install mempalace

# Initialize your palace
mempalace init ~/projects/myapp
```

On Arch or other PEP 668-managed systems, you may need:

```bash
python3 -m pip install --user --break-system-packages mempalace
```

If `mempalace` is installed into `~/.local/bin`, make sure that directory is on your `PATH`.

Quick sanity check:

```bash
mempalace status
```

### 2. Install the Plugin

```bash
# Clone this repository
git clone https://github.com/victornor/opencode-mempalace.git
cd opencode-mempalace

# Build
bun install
bun run build
```

### 3. Configure OpenCode

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/path/to/opencode-mempalace"]
}
```

Replace `/path/to/opencode-mempalace` with the actual path (e.g., `/home/user/git/opencode-mempalace`).

When published to npm, this will become:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-mempalace"]
}
```

### 4. Optional OpenCode Skill

This repo also includes an optional OpenCode skill at:

```bash
skills/mempalace/SKILL.md
```

To install it locally:

```bash
mkdir -p ~/.opencode/skills/mempalace
cp skills/mempalace/SKILL.md ~/.opencode/skills/mempalace/SKILL.md
```

The skill is a lightweight helper that tells OpenCode to use:

```bash
mempalace instructions <command>
```

for guided MemPalace workflows.

### 5. Set Environment Variables

Add to your shell profile:

```bash
# Directory where exported OpenCode transcripts will be written
export MEMPAL_CONVOS_DIR=~/chats

# Optional: save every N idle checkpoints (default 15)
export MEMPALACE_SAVE_INTERVAL=15

# Optional: enable debug logging to /tmp/opencode-mempalace.log
export MEMPALACE_DEBUG=1

# Optional: override the detected OpenCode SQLite database path
export OPENCODE_DB_PATH=~/.local/share/opencode/opencode.db
```

The plugin will usually auto-detect MemPalace by trying:

1. `MEMPALACE_PYTHON`
2. `/usr/bin/python3`
3. `/usr/bin/python`
4. a few common venv locations

Set `MEMPALACE_PYTHON` only if you need to force a specific Python.

### 6. How Export Works

The plugin reads OpenCode's SQLite database here:

```bash
~/.local/share/opencode/opencode.db
```

For each saved session, it exports a markdown transcript here:

```bash
~/chats/opencode/<session-id>.md
```

```bash
# Quick Start style commands from the main MemPalace repo
mempalace mine ~/projects/myapp
mempalace mine ~/chats --mode convos
mempalace mine ~/chats --mode convos --extract general
mempalace search "why did we switch to GraphQL"
mempalace status
```

### 7. Optional Manual Check

```bash
# Manual verification that MemPalace can ingest exported OpenCode transcripts
mempalace mine ~/chats --mode convos
```

## How Auto-Save Works

OpenCode does not expose Claude Code's `transcript_path`, so the plugin cannot run the MemPalace shell hooks unchanged.

Instead it uses the OpenCode event model directly:

1. `session.idle` fires after each assistant response
2. The plugin tracks idle checkpoints per session
3. Every `MEMPALACE_SAVE_INTERVAL` checkpoints, it exports that session from the OpenCode DB into `~/chats/opencode/<session-id>.md`
4. It then runs:

```bash
mempalace mine "$MEMPAL_CONVOS_DIR" --mode convos
```

5. It also saves on:
- `experimental.session.compacting`
- `session.deleted`
- `server.instance.disposed`

This gives OpenCode the same practical behavior as Claude Code's `Stop` plus `PreCompact` hooks, but implemented using OpenCode's event model.

## Testing

Use a low interval first so you can verify saves quickly:

```bash
export MEMPALACE_SAVE_INTERVAL=2
export MEMPALACE_DEBUG=1
```

Then:

1. Restart OpenCode.
2. Send 2 prompts.
3. Check the debug log:

```bash
tail -50 /tmp/opencode-mempalace.log
```

Expected output:

```text
session.idle for ses_...: 1 idle checkpoints
session.idle for ses_...: 2 idle checkpoints
Saving (idle checkpoint 2) via: ...
Save complete (idle checkpoint 2)
```

4. Confirm exported transcripts exist:

```bash
ls -la ~/chats/opencode
```

5. Inspect one transcript:

```bash
sed -n '1,80p' ~/chats/opencode/<session-id>.md
```

To verify MemPalace actually ingested content, run:

```bash
mempalace status
mempalace search "some phrase from a recent conversation"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMPAL_CONVOS_DIR` | Root directory for exported conversation transcripts | `~/chats` |
| `MEMPALACE_SAVE_INTERVAL` | Save every N `session.idle` events | `15` |
| `MEMPALACE_DEBUG` | Write debug logs to `/tmp/opencode-mempalace.log` | unset |
| `OPENCODE_DB_PATH` | Path to OpenCode SQLite database | `~/.local/share/opencode/opencode.db` |
| `MEMPALACE_PYTHON` | Optional override for which Python runs `-m mempalace` | auto-detected |

## Troubleshooting

### "MEMPALACE_PYTHON not found"

First confirm MemPalace works globally:

```bash
mempalace status
python3 -m mempalace status
```

If you need to force a specific Python, set `MEMPALACE_PYTHON`:

```bash
export MEMPALACE_PYTHON=/path/to/python3
```

### Plugin not loading

- Make sure the path in `opencode.json` is absolute
- Restart OpenCode after changing the config
- Set `MEMPALACE_DEBUG=1` and check `/tmp/opencode-mempalace.log`
- Make sure `~/.local/share/opencode/opencode.db` exists
- Make sure `MEMPAL_CONVOS_DIR` is writable

### Saves are not happening

- Lower `MEMPALACE_SAVE_INTERVAL` to `1` or `2` while testing
- Confirm `session.idle` is firing by enabling `MEMPALACE_DEBUG=1`
- Confirm transcript files are being created under `~/chats/opencode`
- Confirm `mempalace mine "$MEMPAL_CONVOS_DIR" --mode convos` works manually

## For Full MemPalace Integration

This plugin only handles auto-save behavior. For MemPalace's MCP tools, also add this to `opencode.json`:

```json
{
  "mcp": {
    "mempalace": {
      "type": "local",
      "command": ["python3", "-m", "mempalace.mcp_server"],
      "enabled": true
    }
  }
}
```

## More Info

- [MemPalace GitHub](https://github.com/milla-jovovich/mempalace)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)

## License

MIT
