import { apiRequest } from "./client";
import type { Department } from "../types";

export function fetchDepartments() {
  return apiRequest<Department[]>("/departments");
}
