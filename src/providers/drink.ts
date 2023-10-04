// drink.ts

import { PrismaClient, Drink } from "@prisma/client";

const prisma = new PrismaClient();

// Function to retrieve all drinks
export async function getAllDrinks(): Promise<Drink[]> {
    return prisma.drink.findMany();
}

// Function to create a new drink
export async function createDrink(data: Partial<Drink>): Promise<Drink> {
    return prisma.drink.create({ data });
}

// Function to update an existing drink
export async function updateDrink(id: number, data: Partial<Drink>): Promise<Drink> {
    return prisma.drink.update({ where: { id }, data });
}

// Function to delete a drink
export async function deleteDrink(id: number): Promise<Drink> {
    return prisma.drink.delete({ where: { id } });
}
