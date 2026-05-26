import { apiRequest } from "./client";
import type { Person, UserRole } from "../types";

export type UpdateProfilePayload = {
  name: string;
  contactNumber?: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AdminPersonPayload = {
  name: string;
  email: string;
  contactNumber?: string | null;
  departmentId?: number | null;
  role: UserRole;
};

export type CreateAdminPersonPayload = AdminPersonPayload & {
  password: string;
};

export function fetchProfile() {
  return apiRequest<Person>("/profile");
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiRequest<Person>("/profile", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<{ message: string }>("/profile/password", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function fetchAdminPeople() {
  return apiRequest<Person[]>("/admin/people");
}

export function createAdminPerson(payload: CreateAdminPersonPayload) {
  return apiRequest<Person>("/admin/people", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminPerson(personId: number, payload: AdminPersonPayload) {
  return apiRequest<Person>(`/admin/people/${personId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminPerson(personId: number) {
  return apiRequest<void>(`/admin/people/${personId}`, {
    method: "DELETE"
  });
}
