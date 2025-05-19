import { z } from "zod";
import { Status } from "@prisma/client";
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
  static forgetPasswordSchema = z.object({
    email: z.string().email("Email invalide"),
  });
  static ClientSchema = z.object({
    firstName: z.string().min(3),
    lastName: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(10),
    educationId: z.string().min(6),
    academicYear: z.string().min(4),
    status: z.enum(Object.values(Status) as [string, ...string[]]),
    title: z.string().optional(),
    campany: z.string().optional(),
    position: z.string().optional(),
    startYear: z.string().optional(),
    workCity: z.string().optional(),
    city: z.string().optional(),
    school: z.string().optional(),
    furtherEd: z.string().optional(),
    selfEmployed: z.string().optional(),
    duration: z.string().optional(),
  });
}
