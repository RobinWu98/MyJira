import type { Department, Person } from "@prisma/client";

type PersonWithDepartment = Person & {
  department?: Department | null;
};

export function toPersonResponse(person: PersonWithDepartment) {
  return {
    id: person.id,
    departmentId: person.departmentId,
    name: person.name,
    email: person.email,
    contactNumber: person.contactNumber,
    role: person.role,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    department: person.department ?? null
  };
}
