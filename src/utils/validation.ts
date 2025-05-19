import { z } from "zod";

export default class Validation {
  static createUserSchema = z.object({
    userName: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(10),
  });
  static loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    stay: z.boolean().optional().default(false),
  });
  static resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string().min(10),
  });
}
