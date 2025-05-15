import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { z } from "zod";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const createUserSchema = z.object({
  userName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(10),
});
type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});
type LoginUserInput = z.infer<typeof loginSchema>;

export default class UserController {
  static async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedData: CreateUserInput = createUserSchema.parse(req.body);
      const userExists = await prisma.user.findUnique({
        where: { email: parsedData.email },
      });
      if (userExists) {
        res.status(409).json({ message: "User already exists" });
        return;
      }
      const hashedPassword: string = await argon2.hash(parsedData.password);
      const user: User = await prisma.user.create({
        data: {
          userName: parsedData.userName,
          email: parsedData.email,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        next(error);
      }
    }
  }
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedData: LoginUserInput = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: parsedData.email },
      });

      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const isPasswordValid: boolean = await argon2.verify(
        user.password!,
        parsedData.password
      );
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
      }
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be defined in environment variables");
      }
      const token = jwt.sign(
        {
          userId: user.userId,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000,
        path: "/",
      });
      res.status(200).json({
        message: "Login successful",
        user: {
          userId: user.userId,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
  static async userData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { userId },
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const users = await prisma.user.findMany();
    res.json(users);
  }
  static async logout(
    req: Request,
    res: Response,
  ) {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  }

}
