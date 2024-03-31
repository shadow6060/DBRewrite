import {PrismaClient} from "@prisma/client";

/**
 * who would've guessed, its the database
 */
export const db = new PrismaClient();

//todo