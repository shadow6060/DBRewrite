## Structures Folder

This folder contains classes and utilities for commands, command handling, and lifetime maps.

---

### `command.ts`

- **`Command`**Base class for Discord commands.

  - `name`, `description` — command metadata
  - `executor` — function to run when invoked
  - `permissions` — array of required permissions
  - Methods: `addOption`, `addStringOption`, `addUserOption`, `addAlias`, `setCategory`, etc.
  - Supports both slash commands and local execution options.
- **`ExtendedCommand`**Extends `Command` with:

  - `global` / `local` flags
  - `servers` — array of guilds where the command is registered locally

---

### `lifetimemap.ts`

- **`LifetimeMap<K, V>`**A Map where entries automatically expire after a set lifetime (in ms).
  - Methods: `set`, `delete`, `clear`
  - Example usage: caching temporary user state, cooldowns.

---

### `prefixCommand.ts`

- **`PrefixCommand`**Extends `Command` to support prefix-style commands.

  - `prefixExecutor` — function to run for prefix commands
  - `options` — argument types (`string`, `integer`, `user`)
  - `aliases` — array of alternative names
  - Permissions and accessibility checks included.
- **`handlePrefixCommand(message: Message)`**
  Helper function to parse and execute prefix commands from messages.

---

### `settings.ts`

- Utilities for global application settings.
  - `isManualMode()` — checks if manual mode is enabled
  - `setManualMode(enabled: boolean)` — toggle manual mode

---

Each file in this folder is designed to provide a modular, reusable structure for command management, state handling, and configuration.
