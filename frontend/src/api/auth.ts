import { apiRequest } from "./client";
import type { Person } from "../types";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: Person;
};

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchMe() {
  return apiRequest<Person>("/auth/me");
}
