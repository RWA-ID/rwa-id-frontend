import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { buildMerkleTree, generateProof, parseCSV, computeNameHash } from "./merkle";
import { z } from "zod";

const uploadSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  csvText: z.string().min(1, "CSV content is required"),
});

const proofQuerySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/platform/upload", async (req, res) => {
    try {
      const validation = uploadSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Invalid request" 
        });
      }

      const { slug, csvText } = validation.data;

      const entries = parseCSV(csvText);

      const tree = buildMerkleTree(entries);

      await storage.saveProject({
        slug: slug.toLowerCase(),
        merkleRoot: tree.root,
        entries: tree.entries,
        createdAt: Date.now(),
      });

      return res.json({
        merkleRoot: tree.root,
        rowCount: entries.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to process CSV" 
      });
    }
  });

  app.get("/api/proof", async (req, res) => {
    try {
      const validation = proofQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Invalid query parameters",
          eligible: false,
        });
      }

      const { slug, name, address } = validation.data;

      const project = await storage.getProject(slug);
      
      if (!project) {
        return res.json({
          proof: [],
          nameHash: computeNameHash(name),
          eligible: false,
        });
      }

      const { proof, found } = generateProof(project.entries, address, name);
      const nameHash = computeNameHash(name);

      return res.json({
        proof,
        nameHash,
        eligible: found,
      });
    } catch (error) {
      console.error("Proof error:", error);
      return res.status(500).json({ 
        error: "Failed to generate proof",
        eligible: false,
      });
    }
  });

  app.get("/api/project/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const project = await storage.getProject(slug);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      return res.json({
        slug: project.slug,
        merkleRoot: project.merkleRoot,
        entryCount: project.entries.length,
        createdAt: project.createdAt,
      });
    } catch (error) {
      console.error("Project fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  return httpServer;
}
