# 🥤 Mystic Bar – Interactive Drink Menu System

Welcome to the most dangerously delightful virtual bar menu this side of Discord. This system lets users browse drink categories, select their favorite beverage, and place an order — with support for tabs, balances, and page navigation.

This README walks you through the various moving parts of the codebase. If you get lost, just remember: always blame the bartender.

---

## 🗂️ Overview of Core Components

### 1. `handleCategorySelection.ts`

**What it does:**
Kicks off the drink menu flow. Presents a select menu of categories to the user.

**Key Features:**

- Handles initial user interaction (command, button, or select menu).
- Sends a category select menu.
- Stores active menu state (`activeMenus`).
- Listens for a category selection, then hands off to `handleDrinkPages`.

**Function to know:**

```ts
handleCategorySelection(interaction, categories, userId)
```

---

### 2. `drinkMenuUtils.ts`

**What it does:**
Keeps your interactions from blowing up in your face. Safely handles interaction methods like `deferUpdate` and `followUp`.

**Also includes:**

- A `setCooldown()` function to prevent users from spamming buttons like it’s whack-a-mole.

---

### 3. `drinkPageHandler.ts`

**What it does:**
The brain behind the drink menu. After a category is selected, this handles the rest — pagination, ordering, tabs, and confirmations.

**Key Features:**

- Pages through drinks (4 per page).
- Users can go back to category selection.
- Confirms orders and optionally charges balance or puts it on a tab.
- Sends order data to the database.
- Handles user interactions via collector.
- Applies cooldowns to navigation buttons.

**Function to know:**

```ts
handleDrinkPages(selectInteraction, category, categories, userId)
```

---

### 4. `orderEmbeds.ts`

**What it does:**
Builds and dispatches sexy-looking order embeds when a user places an order.

**Bonus Features:**

- Mentions staff role if manual mode is on.
- Logs each order to a designated "brewery" channel.
- Uses `EmbedBuilder` for clean, structured formatting.

---

### 5. `DrinkMenuComp.ts`

**What it does:**
Generates all the buttons and select menus used in the system.

**Exports include:**

- `createCategorySelectMenu(categories)`
- `createDrinkSelectMenu(drinks)`
- `createNavigationButtons(currentPage, totalPages)`
- `createConfirmationButtons(hasPrice)`

Basically, this file makes your UI go *boop*.

---

### 6. `safeInteraction.ts`

**What it does:**
Advanced error-handling for Discord interactions.

**Why it matters:**
Discord can be finicky. These helpers ensure that failed or stale interactions don’t crash your flow (or your sanity).

**Functions:**

- `safeReply()`
- `safeFollowUp()`
- `safeDeferUpdate()`
- `safeUpdate()`

All gracefully handle `DiscordAPIError` 10062 (a.k.a. "Interaction not found").

---

## 💾 Flow Summary

1. **User triggers drink menu command** → `handleCategorySelection` displays category menu.
2. **User selects a category** → `handleDrinkPages` displays drinks in pages.
3. **User navigates, selects a drink** → Confirmation buttons appear.
4. **User confirms or tabs order** → `orderEmbeds` sends order to staff channel.
5. **Profit. 🍹**

---

## 💡 Tips

- The `activeMenus` map helps keep track of messages to clean up and avoid clutter.
- Page navigation cooldown (`5s`) ensures a smooth experience without spam.
- Ephemeral messages are used for confirmations to keep chat clean.
- Manual mode switches between auto-prepared orders vs staff alerts.

---

## 🧃 Future Ideas (Optional)

- Drink search by name or price range.
- Admin panel for adding/removing drinks.
- User drink history ("Your Orders").

---

Now go forth, brave developer — and may your menu be ever well-mixed. 🍸
