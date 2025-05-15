import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { z } from "zod";
import { Status } from "@prisma/client";
export const addClientSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  email: z.string().email(),
  phone: z.number().min(10),
  education: z.string().min(6),
  academicYear: z.string().min(4),
  Status: z.string().min(5),
});
type AddClientInput = z.infer<typeof addClientSchema>;

export default class ClientController {
  static async addClient(
    req: Request,
    res: Response,
  ): Promise<any> {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        education,
        academicYear,
        Status,
      }: AddClientInput = addClientSchema.parse(req.body);
      const client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          education,
          academicYear,
          Status: Status as Status,
        },
      });
      return res.status(201).json({
        message: "Client created successfully",
        client,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
