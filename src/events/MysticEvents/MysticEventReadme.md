# MysticUtils / MysticEvents Overview

This README documents the custom utilities, commands, and event handlers you’ve implemented. It’s designed to help any dev understand how your modules work and how to extend them.

---

## Structures Folder

This folder contains classes and utilities for commands, command handling, and lifetime maps.

### `command.ts`

* **`Command`** — Base class for Discord commands.
  * Metadata: `name`, `description`
  * Execution: `executor` function
  * Permissions: `permissions` array
  * Methods: `addOption`, `addStringOption`, `addUserOption`, `addAlias`, `setCategory`, etc.
  * Supports both slash commands and local execution options.
* **`ExtendedCommand`** — Extends `Command` with additional properties:
  * `global` / `local` flags
  * `servers` — guild IDs for local registration

---

### `lifetimemap.ts`

* **`LifetimeMap<K, V>`** — A Map where entries automatically expire after a set lifetime (ms).
  * Methods: `set`, `delete`, `clear`
  * Useful for temporary caching, cooldowns, or ephemeral user state.

---

### `prefixCommand.ts`

* **`PrefixCommand`** — Extends `Command` for prefix-based commands.
  * `prefixExecutor` — function to run for prefix commands
  * `options` — argument types (`string`, `integer`, `user`)
  * `aliases` — alternative names
  * Permission and accessibility checks included.
* **`handlePrefixCommand(message: Message)`** — Parses and executes prefix commands, verifying permissions and handling unknown commands gracefully.

---

### `settings.ts`

* Utilities for managing global application settings.
  * `isManualMode()` — returns whether manual mode is enabled
  * `setManualMode(enabled: boolean)` — toggles manual mode

---

## MysticEvents Folder

### `expCreate.ts`

Handles user XP and leveling events.

**Key Features:**

* **Automatic XP Tracking:** Listens to `messageCreate` events and awards XP in allowed channels.
* **Cooldown System:** Users gain XP once per minute per guild.
* **Database Integration:** Uses Prisma to store and update:
  * `userInfo` — basic user data
  * `guildsXP` — XP and level data
* **Level-Up Notifications:** Sends messages to a configured channel when a user levels up.
* **XP Restrictions:** Respects server settings:
  * `xpEnabled` toggle
  * `xpEnabledChannels` to limit XP to specific channels
* **XP Gain Logic:** Random XP 1–20 per eligible message; levels follow `level * 100` threshold (max level 999)
* **Safe Disconnection:** Prisma client disconnects on process exit.

---

## Notes for Developers

* Focus is on modular, reusable code.
* Only files created/modified by the author are documented.
* Provides a clear structure for commands, events, and utility maps.
* Encourages safe database usage and permission checks for Discord bots.

---

This README can serve as a guide for anyone extending your bot, integrating new com
