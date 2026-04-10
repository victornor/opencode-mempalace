import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { spawn } from "child_process"
import { join } from "path"
import { Database } from "bun:sqlite"

const LOG_FILE = "/tmp/opencode-mempalace.log"
const SAVE_INTERVAL = Number(process.env.MEMPALACE_SAVE_INTERVAL || "15")
const DEBUG = process.env.MEMPALACE_DEBUG === "1"
const OPENCODE_DB_PATH = process.env.OPENCODE_DB_PATH || join(process.env.HOME || "", ".local/share/opencode/opencode.db")

const idleCounts = new Map<string, number>()
const activeSaves = new Set<string>()
const knownSessions = new Set<string>()

type MessageRow = {
  id: string
  time_created: number
  data: string
}

type PartRow = {
  id: string
  message_id: string
  time_created: number
  data: string
}

function log(msg: string) {
  if (!DEBUG) return

  try {
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`)
  } catch (e: any) {
    console.error("LOG ERROR:", e.message)
  }
}

function findMempalacePython() {
  const candidates = [
    process.env.MEMPALACE_PYTHON,
    "/usr/bin/python3",
    "/usr/bin/python",
    join(process.env.HOME || "", "git/mempalace/.venv/bin/python3.12"),
    join(process.env.HOME || "", "git/mempalace/.venv/bin/python3"),
    join(process.env.HOME || "", ".mempalace-venv/bin/python3.12"),
    join(process.env.HOME || "", ".mempalace-venv/bin/python3"),
  ]

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate
  }

  return null
}

function getConvosDir() {
  return process.env.MEMPAL_CONVOS_DIR || join(process.env.HOME || "", "chats")
}

function getExportDir() {
  return join(getConvosDir(), "opencode")
}

function sanitizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim()
}

function extractPartText(partData: string) {
  try {
    const parsed = JSON.parse(partData)
    if (parsed?.type === "text" && typeof parsed.text === "string") return sanitizeText(parsed.text)
    return ""
  } catch {
    return ""
  }
}

function extractMessageRole(messageData: string) {
  try {
    const parsed = JSON.parse(messageData)
    if (parsed?.role === "user" || parsed?.role === "assistant") return parsed.role as "user" | "assistant"
  } catch {}
  return null
}

function exportSessionTranscript(sessionId: string) {
  if (!existsSync(OPENCODE_DB_PATH)) {
    log(`Skipping export for ${sessionId} - OpenCode DB not found at ${OPENCODE_DB_PATH}`)
    return null
  }

  const exportDir = getExportDir()
  mkdirSync(exportDir, { recursive: true })

  const db = new Database(OPENCODE_DB_PATH, { readonly: true })

  try {
    const messages = db
      .query<MessageRow, [string]>(
        "select id, time_created, data from message where session_id = ? order by time_created asc"
      )
      .all(sessionId)

    if (!messages.length) {
      log(`Skipping export for ${sessionId} - no messages found`)
      return null
    }

    const parts = db
      .query<PartRow, [string]>(
        "select id, message_id, time_created, data from part where session_id = ? order by time_created asc"
      )
      .all(sessionId)

    const partsByMessage = new Map<string, string[]>()
    for (const part of parts) {
      const text = extractPartText(part.data)
      if (!text) continue
      const existing = partsByMessage.get(part.message_id) || []
      existing.push(text)
      partsByMessage.set(part.message_id, existing)
    }

    const lines: string[] = []
    lines.push(`# OpenCode Session ${sessionId}`)
    lines.push("")

    for (const message of messages) {
      const role = extractMessageRole(message.data)
      if (!role) continue

      const text = (partsByMessage.get(message.id) || []).join("\n\n").trim()
      if (!text) continue

      if (role === "user") {
        for (const line of text.split("\n")) {
          lines.push(`> ${line}`)
        }
        lines.push("")
        continue
      }

      lines.push(text)
      lines.push("")
      lines.push("---")
      lines.push("")
    }

    const transcript = lines.join("\n").trim() + "\n"
    const outputPath = join(exportDir, `${sessionId}.md`)
    writeFileSync(outputPath, transcript)
    log(`Exported transcript for ${sessionId} to ${outputPath}`)
    return outputPath
  } finally {
    db.close()
  }
}

function runMempalaceMine(reason: string) {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    const python = findMempalacePython()
    const convosDir = getConvosDir()

    if (!python) {
      log(`Skipping save (${reason}) - MEMPALACE_PYTHON not found`)
      resolve({ success: false, error: "python not found" })
      return
    }

    if (!existsSync(convosDir)) {
      log(`Skipping save (${reason}) - conversations dir not found: ${convosDir}`)
      resolve({ success: false, error: "conversations dir not found" })
      return
    }

    log(`Saving (${reason}) via: ${python} -m mempalace mine ${convosDir} --mode convos`)

    const proc = spawn(python, ["-m", "mempalace", "mine", convosDir, "--mode", "convos"], {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    proc.on("close", (code) => {
      if (code === 0) {
        log(`Save complete (${reason})`)
        resolve({ success: true })
      } else {
        log(`Save failed (${reason}): ${stderr.substring(0, 300) || `Exit ${code}`}`)
        resolve({ success: false, error: stderr || `Exit ${code}` })
      }
    })

    proc.on("error", (error) => {
      log(`Save process error (${reason}): ${error.message}`)
      resolve({ success: false, error: error.message })
    })
  })
}

export const MemPalacePlugin = async () => {
  log("MemPalace plugin loaded")
  log(`Save interval: ${SAVE_INTERVAL}`)
  log(`OpenCode DB path: ${OPENCODE_DB_PATH}`)

  const saveForSession = async (sessionId: string, reason: string) => {
    if (activeSaves.has(sessionId)) {
      log(`Skipping save (${reason}) for ${sessionId} - save already in progress`)
      return { success: false, error: "save already in progress" }
    }

    activeSaves.add(sessionId)
    try {
      const transcriptPath = exportSessionTranscript(sessionId)
      if (!transcriptPath) {
        return { success: false, error: "export failed" }
      }

      return await runMempalaceMine(reason)
    } finally {
      activeSaves.delete(sessionId)
    }
  }

  const saveKnownSessions = async (reason: string) => {
    for (const sessionId of knownSessions) {
      await saveForSession(sessionId, `${reason} (${sessionId})`)
    }
  }

  return {
    event: async ({ event }: { event: any }) => {
      log(`EVENT: ${event.type}`)

      const sessionId = event.properties?.sessionID || event.properties?.sessionId
      if (sessionId) knownSessions.add(sessionId)

      if (event.type === "session.idle") {
        const idleSessionId = sessionId || "opencode-session"
        const count = (idleCounts.get(idleSessionId) || 0) + 1
        idleCounts.set(idleSessionId, count)

        log(`session.idle for ${idleSessionId}: ${count} idle checkpoints`)

        if (count % SAVE_INTERVAL === 0) {
          await saveForSession(idleSessionId, `idle checkpoint ${count}`)
        }
        return
      }

      if (event.type === "session.deleted" && sessionId) {
        await saveForSession(sessionId, "session deleted")
        return
      }

      if (event.type === "server.instance.disposed") {
        await saveKnownSessions("server disposed")
      }
    },

    "experimental.session.compacting": async (_input: any, output: any) => {
      log("session compacting - emergency save")
      await saveKnownSessions("precompact")
      output.context.push("## MemPalace Auto-Save\nOpenCode session transcripts were exported and saved to MemPalace before compaction.")
    },
  }
}

export default MemPalacePlugin
