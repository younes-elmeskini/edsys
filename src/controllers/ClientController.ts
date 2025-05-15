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
  Status: z.enum(Object.values(Status) as [string, ...string[]]),
  title: z.string().optional(),
  campany: z.string().optional(),
  position: z.string().optional(),
  startYear: z.string().optional(),
  city: z.string().optional(),
  school: z.string().optional(),
  furtherEd: z.string().optional(),
  selfEmployed: z.string().optional(),
  duration: z.string().optional(),
});
type AddClientInput = z.infer<typeof addClientSchema>;

export default class ClientController {
  static async addClient(req: Request, res: Response): Promise<any> {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        education,
        academicYear,
        Status,
        title,
        campany,
        position,
        startYear,
        city,
        school,
        furtherEd,
        selfEmployed,
        duration,
      }: AddClientInput = addClientSchema.parse(req.body);
      const clientExists = await prisma.client.findUnique({
        where: { email },
      });
      if (clientExists) {
        return res.status(409).json({ message: "Client already exists" });
      }
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
      let status;
      if (Status === "RECRUITED") {
        status = await prisma.recruited.create({
          data: {
            clientId :client.clientId,
            title,
            campany,
            position,
            startYear,
            workCity: city,
          },
        });
      }
      if (Status === "FARTHER") {
        status = await prisma.further.create({
          data: {
            clientId :client.clientId,
            school,
            furtherEd,
            city,
          },
        });
      }
      if (Status === "EMPLOYED") {
        status = await prisma.self_employed.create({
          data: {
            clientId :client.clientId,
            selfEmployed,
          },
        });
      }
      if (Status === "SEARCHING") {
        status = await prisma.searching.create({
          data: {
            clientId :client.clientId,
            duration,
          },
        });
      }
      return res.status(201).json({
        message: "Client created successfully",
        client,
        status: status ? status : null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
}
