import { constants } from "../../providers/config";

const globalCooldowns: Record<string, Record<string, number>> = {};

export function isOnCooldown(userId: string, command: string): boolean {
	return !!(globalCooldowns[userId]?.[command] && globalCooldowns[userId][command] >= Date.now());
}

export function setCooldown(userId: string, command: string): void {
	if (!globalCooldowns[userId]) {
		globalCooldowns[userId] = {};
	}

	// Get cooldown from constants based on command
	const commandData = constants[command as keyof typeof constants];

	// Ensure it's an object and has 'cooldownMs'
	if (typeof commandData === "object" && "cooldownMs" in commandData) {
		globalCooldowns[userId][command] = Date.now() + commandData.cooldownMs;
	}
}

export function getCooldownTimeRemaining(userId: string, command: string): number {
	return Math.max(globalCooldowns[userId]?.[command] - Date.now(), 0);
}
