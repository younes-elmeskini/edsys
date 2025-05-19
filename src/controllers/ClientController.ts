import { Request, Response } from "express";
import prisma from "../prisma/client";
import { z } from "zod";
import { Status } from "@prisma/client";
import Validation from "../utils/validation";

type ClientInput = z.infer<typeof Validation.ClientSchema>;

export default class ClientController {
  static async addClient(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = Validation.ClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error";
        res.status(400).json({
          message: firstError,
        });
        return;
      }
      const parsedData: ClientInput = Validation.ClientSchema.parse(req.body);
      const clientExists = await prisma.client.findUnique({
        where: { email: parsedData.email },
      });
      if (clientExists) {
        res.status(409).json({ message: "Client already exists" });
        return;
      }
      const client = await prisma.client.create({
        data: {
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          email: parsedData.email,
          phone: parsedData.phone,
          educationId: parsedData.educationId,
          academicYear: parsedData.academicYear,
          Status: parsedData.status as Status,
        },
      });
      if (parsedData.status === "RECRUITED") {
        await prisma.recruited.create({
          data: {
            clientId: client.clientId,
            title: parsedData.title,
            campany: parsedData.campany,
            position: parsedData.position,
            startYear: parsedData.startYear,
            workCity: parsedData.workCity,
          },
        });
      }
      if (parsedData.status === "FARTHER") {
        await prisma.further.create({
          data: {
            clientId: client.clientId,
            school: parsedData.school,
            furtherEd: parsedData.furtherEd,
            city: parsedData.city,
          },
        });
      }
      if (parsedData.status === "EMPLOYED") {
        await prisma.self_employed.create({
          data: {
            clientId: client.clientId,
            selfEmployed: parsedData.selfEmployed,
          },
        });
      }
      if (parsedData.status === "SEARCHING") {
        await prisma.searching.create({
          data: {
            clientId: client.clientId,
            duration: parsedData.duration,
          },
        });
      }
      res.status(201).json({
        message: "Client created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error"});
    }
  }
  static async getClient(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = 10;
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
          education: {
            select: {
              educationName: true,
              educationId: true,
            },
          },
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
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({
        data: clients,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error"});
    }
  }
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const totalClients = await prisma.client.count({
        where: {
          deletedAt: null,
        },
      });
      const totalSoftwareDevelopment = await prisma.client.count({
        where: {
          deletedAt: null,
          education: {
            is: {
              educationName: "Software Development",
            },
          },
        },
      });
      const totalDataScience = await prisma.client.count({
        where: {
          deletedAt: null,
          education: {
            is: {
              educationName: "Data Science & AI",
            },
          },
        },
      });
      const totalCreativeTechnologies = await prisma.client.count({
        where: {
          deletedAt: null,
          education: {
            is: {
              educationName: "Creative Technologies",
            },
          },
        },
      });
      const SoftwareDevelopment =
        (totalSoftwareDevelopment / totalClients) * 100;
      const DataScience = (totalDataScience / totalClients) * 100;
      const CreativeTechnologies =
        (totalCreativeTechnologies / totalClients) * 100;
      res.status(200).json({
        data: {
          totalClients,
          SoftwareDevelopment,
          DataScience,
          CreativeTechnologies,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const validationResult = Validation.ClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const parsedData: ClientInput = Validation.ClientSchema.parse(req.body);
      const existingClient = await prisma.client.findFirst({
        where: {
          email: parsedData.email,
          NOT: {
            clientId: clientId,
          },
        },
      });

      if (existingClient) {
        res.status(400).json({
          message: "Email already exists for another client",
        });
        return;
      }

      await prisma.client.update({
        where: { clientId },
        data: {
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          email: parsedData.email,
          phone: parsedData.phone,
          educationId: parsedData.educationId,
          academicYear: parsedData.academicYear,
          Status: parsedData.status as Status,
        },
      });
      await Promise.all([
        prisma.recruited.deleteMany({ where: { clientId } }),
        prisma.further.deleteMany({ where: { clientId } }),
        prisma.self_employed.deleteMany({ where: { clientId } }),
        prisma.searching.deleteMany({ where: { clientId } }),
      ]);

      if (parsedData.status === "RECRUITED") {
        await prisma.recruited.create({
          data: {
            clientId,
            title: parsedData.title,
            campany: parsedData.campany,
            position: parsedData.position,
            startYear: parsedData.startYear,
            workCity: parsedData.workCity,
          },
        });
      } else if (parsedData.status === "FARTHER") {
        await prisma.further.create({
          data: {
            clientId,
            school: parsedData.school,
            furtherEd: parsedData.furtherEd,
            city: parsedData.city,
          },
        });
      } else if (parsedData.status === "EMPLOYED") {
        await prisma.self_employed.create({
          data: {
            clientId,
            selfEmployed: parsedData.selfEmployed,
          },
        });
      } else if (parsedData.status === "SEARCHING") {
        await prisma.searching.create({
          data: {
            clientId,
            duration: parsedData.duration,
          },
        });
      } else {
        res.status(400).json({
          message: "Invalid status",
        });
        return;
      }
      res.status(200).json({
        message: "Client updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error"});
    }
  }
  static async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      await prisma.client.update({
        where: { clientId },
        data: {
          deletedAt: new Date(),
        },
      });
      res.status(200).json({
        message: "Client deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error"});
    }
  }
}
