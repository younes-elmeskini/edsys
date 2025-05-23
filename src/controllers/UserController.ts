import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { z } from "zod";
import * as argon2 from "argon2";
import { User, resetToken } from "@prisma/client";
import transporter from "../utils/mailer";
import crypto from "crypto";
import { generateToken } from "../middlewares/auth";
import Validation from "../utils/validation";

type CreateUserInput = z.infer<typeof Validation.createUserSchema>;

type LoginUserInput = z.infer<typeof Validation.loginSchema>;

type ResetPasswordInput = z.infer<typeof Validation.resetPasswordSchema>;

type ForgetPasswordInput = z.infer<typeof Validation.forgetPasswordSchema>;

export default class UserController {
  static async createUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const validationResult = Validation.createUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const parsedData: CreateUserInput = Validation.createUserSchema.parse(
        req.body
      );
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
      res.status(500).json({ message: "Authentication failed"  });
    }
  }
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = Validation.loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const parsedData: LoginUserInput = Validation.loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: parsedData.email },
      });

      if (!user) {
        res.status(404).json({ message: "Invalid email" });
        return;
      }

      const isPasswordValid: boolean = await argon2.verify(
        user.password!,
        parsedData.password
      );
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const stayed = parsedData.stay;
      const token = generateToken(user, stayed);
      if (!token) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: stayed ? 15 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        message: "Login successful",
        user: {
          userId: user.userId,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
  static async userData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          userId: true,
          userName: true,
          role: true,
          avatar: true,
        },
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ data: user });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  static async forgetPassword(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const validationResult = Validation.forgetPasswordSchema.safeParse(
        req.body
      );
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const { email }: ForgetPasswordInput =
        Validation.forgetPasswordSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiredAt = new Date(Date.now() + 60 * 60 * 1000);

      const token: resetToken = await prisma.resetToken.create({
        data: {
          token: resetToken,
          expiredAt: expiredAt,
          userId: user.userId,
        },
      });
      const resetUrl = `http://localhost:3000/reset/${resetToken}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Réinitialisation de mot de passe",
        html: `<p>Pour réinitialiser votre mot de passe, cliquez ici : <a href="${resetUrl}">reset password here</a></p>`,
      });
      res.status(200).json({ message: "Password reset token sent", token});
    } catch (error) {
      console.error("Error in forgetPassword:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword }: ResetPasswordInput =
      Validation.resetPasswordSchema.parse(req.body);
    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!resetToken) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }
    if (resetToken.expiredAt < new Date()) {
      res.status(400).json({ message: "Token expired" });
      return;
    }
    const hashedPassword = await argon2.hash(newPassword);
    await prisma.user.update({
      where: { userId: resetToken.userId },
      data: { password: hashedPassword },
    });
    await prisma.resetToken.delete({
      where: { token },
    });
    res.status(200).json({ message: "Password reset successful" });
  }
  static async getUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    const users = await prisma.user.findMany();
    res.json(users);
  }
  static async logout(req: Request, res: Response) {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  }
}
