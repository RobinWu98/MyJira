import { apiRequest } from "./client";
import type { Person } from "../types";

export function fetchPeople() {
  return apiRequest<Person[]>("/people");
}
