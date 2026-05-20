import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { ForbiddenError, UnauthorizedError } from "./error-handler.js";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signAuthToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: "8h" }
  );
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const person = await prisma.person.findUnique({ where: { id: Number(payload.sub) } });

    if (!person) {
      throw new UnauthorizedError("Authentication required");
    }

    req.user = {
      id: person.id,
      email: person.email,
      role: person.role
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    next(new UnauthorizedError("Authentication required"));
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError("Forbidden"));
      return;
    }

    next();
  };
}
