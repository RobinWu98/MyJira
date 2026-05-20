import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const people = [
    { name: "Alex Chen", email: "alex@example.com" },
    { name: "Priya Shah", email: "priya@example.com" },
    { name: "Jordan Lee", email: "jordan@example.com" }
  ];

  for (const person of people) {
    await prisma.person.upsert({
      where: { email: person.email },
      update: {},
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
