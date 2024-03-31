import {PrismaClient} from "@prisma/client";

/**
 * who would've guessed, it's the database
 */
export const db = new PrismaClient();

//todo