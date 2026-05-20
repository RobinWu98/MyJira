import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: "General", description: "Default department for uncategorized work" },
    { name: "IT", description: "Technology and systems work" },
    { name: "Operations", description: "Operational delivery and coordination" },
    { name: "Finance", description: "Budgeting and finance work" }
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: { description: department.description },
      create: department
    });
  }

  const general = await prisma.department.findUniqueOrThrow({ where: { name: "General" } });
  const it = await prisma.department.findUniqueOrThrow({ where: { name: "IT" } });
  const operations = await prisma.department.findUniqueOrThrow({ where: { name: "Operations" } });
  const finance = await prisma.department.findUniqueOrThrow({ where: { name: "Finance" } });

  const people = [
    {
      name: "Admin User",
      email: "admin@example.com",
      departmentId: general.id,
      contactNumber: "0400 000 001",
      password: "admin123",
      role: "ADMIN" as const
    },
    {
      name: "Manager User",
      email: "manager@example.com",
      departmentId: operations.id,
      contactNumber: "0400 000 002",
      password: "manager123",
      role: "MANAGER" as const
    },
    {
      name: "Normal User",
      email: "user@example.com",
      departmentId: it.id,
      contactNumber: "0400 000 003",
      password: "user123",
      role: "USER" as const
    },
    {
      name: "Default User",
      email: "default@example.com",
      departmentId: general.id,
      contactNumber: null,
      password: "user123",
      role: "USER" as const
    },
    {
      name: "Alex Chen",
      email: "alex@example.com",
      departmentId: it.id,
      contactNumber: null,
      password: "user123",
      role: "USER" as const
    },
    {
      name: "Priya Shah",
      email: "priya@example.com",
      departmentId: operations.id,
      contactNumber: null,
      password: "user123",
      role: "USER" as const
    },
    {
      name: "Jordan Lee",
      email: "jordan@example.com",
      departmentId: finance.id,
      contactNumber: null,
      password: "user123",
      role: "USER" as const
    }
  ];

  for (const person of people) {
    const passwordHash = await bcrypt.hash(person.password, 10);

    await prisma.person.upsert({
      where: { email: person.email },
      update: {
        name: person.name,
        departmentId: person.departmentId,
        contactNumber: person.contactNumber,
        passwordHash,
        role: person.role
      },
      create: {
        name: person.name,
        email: person.email,
        departmentId: person.departmentId,
        contactNumber: person.contactNumber,
        passwordHash,
        role: person.role
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
