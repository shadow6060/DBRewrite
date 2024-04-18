// @ts-nocheck
import type { Drink } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Retrieves all drinks from the database. */
export async function getAllDrinks(): Promise<Drink[]> {
	return prisma.drink.findMany();
}

/**
 * Creates a drink.
 * @param data - Drink data. The `createdAt` and `updatedAt` fields are optional, and will be set to the current timestamp if not provided.
 */
export async function createDrink(
	data: Omit<Drink, "createdAt" | "updatedAt"> &
		Partial<Pick<Drink, "createdAt" | "updatedAt">>
): Promise<Drink> {
	return prisma.drink.create({ data });
}

/**
 * Retrieves a drink by its ID, and updates it.
 * @param id - The ID of the drink to update.
 * @param data - Drink data. The `createdAt` and `updatedAt` fields are optional, and will be set to the current timestamp if not provided.
 */
export async function updateDrink(
	id: number,
	data: Omit<Drink, "createdAt" | "updatedAt"> &
		Partial<Pick<Drink, "createdAt" | "updatedAt">>
): Promise<Drink> {
	return prisma.drink.update({ where: { id }, data });
}

/**
 * Deletes a drink.
 * @param id - The ID of the drink to delete.
 */
export async function deleteDrink(id: number): Promise<Drink> {
	return prisma.drink.delete({ where: { id } });
}
