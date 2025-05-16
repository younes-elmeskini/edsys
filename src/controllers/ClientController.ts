import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { z } from "zod";
import { Status } from "@prisma/client";
export const ClientSchema = z.object({
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
type ClientInput = z.infer<typeof ClientSchema>;

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
      }: ClientInput = ClientSchema.parse(req.body);
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
            clientId: client.clientId,
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
            clientId: client.clientId,
            school,
            furtherEd,
            city,
          },
        });
      }
      if (Status === "EMPLOYED") {
        status = await prisma.self_employed.create({
          data: {
            clientId: client.clientId,
            selfEmployed,
          },
        });
      }
      if (Status === "SEARCHING") {
        status = await prisma.searching.create({
          data: {
            clientId: client.clientId,
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
  static async getClient(req: Request, res: Response): Promise<any> {
    try {
      const search = req.query.search as string ;
      const page = parseInt(req.query.page as string) || 1; 
      const pageSize = 2
      const skip = (page - 1) * pageSize;

      let whereClause: any = {
        deletedAt: null,
      };

      if (search) {
        whereClause = {
          ...whereClause,
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }
      const totalClients = await prisma.client.count({
        where: whereClause,
      });
      const totalPages = Math.ceil(totalClients / pageSize);
      if (page > totalPages) {
        return res.status(404).json({ message: "No more clients" });
      }
      const clients = await prisma.client.findMany({
        where: whereClause,
        skip: skip,
        take: pageSize,
        select: {
          clientId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          education: true,
          academicYear: true,
          Status: true,
          Recruited: {
            select: {
              title: true,
              campany: true,
              position: true,
              startYear: true,
              workCity: true,
            },
          },
          Further: {
            select: {
              school: true,
              furtherEd: true,
              city: true,
            },
          },
          self_employed: {
            select: {
              selfEmployed: true,
            },
          },
          searching: {
            select: {
              duration: true,
            },
          },
        },
      });
      return res.status(200).json({
        data: clients,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
  static async updateClient(req: Request, res: Response): Promise<any> {
    try {
      const { clientId } = req.params;
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
      }: ClientInput = ClientSchema.parse(req.body);
      const existingClient = await prisma.client.findFirst({
        where: {
          email,
          NOT: {
            clientId: clientId,
          },
        },
      });

      if (existingClient) {
        return res.status(400).json({
          message: "Email already exists for another client",
        });
      }

      const client = await prisma.client.update({
        where: { clientId },
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
      await Promise.all([
        prisma.recruited.deleteMany({ where: { clientId } }),
        prisma.further.deleteMany({ where: { clientId } }),
        prisma.self_employed.deleteMany({ where: { clientId } }),
        prisma.searching.deleteMany({ where: { clientId } }),
      ]);

      let status;

      if (Status === "RECRUITED") {
        status = await prisma.recruited.create({
          data: {
            clientId,
            title,
            campany,
            position,
            startYear,
            workCity: city,
          },
        });
      } else if (Status === "FARTHER") {
        status = await prisma.further.create({
          data: {
            clientId,
            school,
            furtherEd,
            city,
          },
        });
      } else if (Status === "EMPLOYED") {
        status = await prisma.self_employed.create({
          data: {
            clientId,
            selfEmployed,
          },
        });
      } else if (Status === "SEARCHING") {
        status = await prisma.searching.create({
          data: {
            clientId,
            duration,
          },
        });
      }

      return res.status(200).json({
        message: "Client updated successfully",
        client,
        status: status ? status : null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
  static async deleteClient(req: Request, res: Response): Promise<any> {
    try {
      const { clientId } = req.params;
      const client = await prisma.client.update({
        where: { clientId },
        data: {
          deletedAt: new Date(),
        },
      });
      return res.status(200).json({
        message: "Client deleted successfully",
        client,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
}
