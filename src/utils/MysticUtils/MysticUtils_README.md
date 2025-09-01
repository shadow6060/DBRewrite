
# 🛠 MysticUtils / Utils Overview

A collection of internal utility files and helpers for your Discord bot. Some of these are used actively, others are older code kept for reference.

---

## 📂 Files Overview

### 1. `CommandHelper.ts`
**Purpose:**  
Creates and manages commands with built-in permission checks.  

**Highlights:**  
- `createPublicCommand` → for global commands with optional permissions.  
- `createLocalCommand` → dev-only commands for local servers.  
- Automatically wraps executors with permission checks.  

**Key function signatures:**  
```ts
createPublicCommand(opts: PublicCommandOptions)
createLocalCommand(opts: LocalCommandOptions)
```

---

### 2. `commandUtils.ts`
**Purpose:**  
Executes commands safely, whether slash or prefix commands.  

**Highlights:**  
- Detects the type of command and runs the appropriate executor.  
- Warns if a command type doesn’t match its input.  
- Catches and logs errors for robust execution.  

**Key function:**  
```ts
executeCommand(command, messageOrInteraction, args?)
```

---

### 3. `cooldownManager.ts`
**Purpose:**  
Manages per-user command cooldowns.  

**Functions:**  
- `isOnCooldown(userId, command)` → checks if a user is on cooldown.  
- `setCooldown(userId, command)` → sets cooldown based on constants.  
- `getCooldownTimeRemaining(userId, command)` → returns remaining cooldown.  

---

### 4. `ephemeralUtils.ts`
**Purpose:**  
Handles ephemeral message cleanup.  

**Function:**  
```ts
dismissEphemeral(interaction)
```  
- Removes recent ephemeral messages sent by the user.  

---

### 5. `helper.ts`
**Purpose:**  
Builds reusable embeds for drink menus.  

**Function:**  
```ts
buildDrinkMenuEmbed(drinkCategories, page, maxPerPage)
```  
- Creates a paginated embed showing drink categories.  

---

### 6. `orderUtils.ts`
**Purpose:**  
Utilities for checking order statuses and cancellation eligibility.  

**Functions:**  
- `canCancelOrder(order)` → determines if an order is cancellable.  
- `isOrderNonCancelable(status)` → checks if the status is permanently non-cancelable.  

---

### 7. `serverConfig.ts`
**Purpose:**  
Schema for server configuration.  

**Fields:**  
- `id`, `prefix`, `welcomeMessageEnabled`, `welcomeMessageChannel`, `xpEnabledChannels`, `levelNotificationChannelId`.  

---

### 8. `settings.ts`
**Purpose:**  
Global settings management.  

**Functions:**  
- `isManualMode()` → checks if manual mode is enabled.  
- `setManualMode(enabled)` → enables or disables manual mode.  

---

## 💡 Notes
- These utilities are shared across multiple features and commands.  
- Some files are old or used for experimental purposes but kept for reference.  
- Proper use of these ensures permission safety, cooldown enforcement, and cleaner ephemeral message handling.  
