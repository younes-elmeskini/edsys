import { z } from "zod";

export default class Validation {
    static createUserSchema = z.object({
        userName: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(10),
    });
}
