import { z } from "zod";

export const allowlistEntrySchema = z.object({
  name: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export type AllowlistEntry = z.infer<typeof allowlistEntrySchema>;

export const projectDataSchema = z.object({
  slug: z.string().min(1),
  merkleRoot: z.string(),
  entries: z.array(allowlistEntrySchema),
  createdAt: z.number(),
});

export type ProjectData = z.infer<typeof projectDataSchema>;

export const uploadRequestSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  csvText: z.string().min(1, "CSV content is required"),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

export const uploadResponseSchema = z.object({
  merkleRoot: z.string(),
  rowCount: z.number(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const proofRequestSchema = z.object({
  slug: z.string(),
  name: z.string(),
  address: z.string(),
});

export type ProofRequest = z.infer<typeof proofRequestSchema>;

export const proofResponseSchema = z.object({
  proof: z.array(z.string()),
  nameHash: z.string(),
  eligible: z.boolean(),
});

export type ProofResponse = z.infer<typeof proofResponseSchema>;

export const users = {};
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
