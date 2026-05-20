import { PrismaClient } from "@prisma/client";

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
    { name: "Default User", email: "default@example.com", departmentId: general.id },
    { name: "Alex Chen", email: "alex@example.com", departmentId: it.id },
    { name: "Priya Shah", email: "priya@example.com", departmentId: operations.id },
    { name: "Jordan Lee", email: "jordan@example.com", departmentId: finance.id }
  ];

  for (const person of people) {
    await prisma.person.upsert({
      where: { email: person.email },
      update: { name: person.name, departmentId: person.departmentId },
      create: person
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
