# AGENTS.md

## Language conventions (standing rule)

- ALL generated code must be written in English from the start: source files, identifiers, function/variable names, comments, string data, database schema, table names, column names, and SQL. Never write code in Spanish and translate it later.
- Respond to the user in Spanish. Only user-facing chat messages are in Spanish; everything in the codebase is English.
- Do NOT modify the user's plan/design files: `docs/Go-din_MVP.txt`, `docs/PLAN.md`, `docs/up-app.txt`, and any other `.md`/`.txt` design documents the user owns. They stay as the user wrote them.
- The database is the source of truth for balance values (table `configurations`); client defaults mirror it.

## Git (standing rule)

- The user runs git commands themselves (add, commit, push, etc.) unless they explicitly ask the agent to do it. Do not run git commands on your own initiative.
