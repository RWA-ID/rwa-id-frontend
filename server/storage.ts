import type { MerkleEntry, MerkleTreeResult } from "./merkle";
import { buildMerkleTree } from "./merkle";
import type { Hex } from "viem";
import type { MerkleTree } from "merkletreejs";
import { db } from "./db";
import { projects, type AllowlistEntry } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface ProjectData {
  slug: string;
  merkleRoot: Hex;
  entries: MerkleEntry[];
  tree: MerkleTree;
  createdAt: number;
}

export interface IStorage {
  getProject(slug: string): Promise<ProjectData | undefined>;
  saveProject(data: ProjectData): Promise<void>;
  getAllProjects(): Promise<ProjectData[]>;
}

export class DatabaseStorage implements IStorage {
  async getProject(slug: string): Promise<ProjectData | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug.toLowerCase()));

    if (!project) {
      return undefined;
    }

    const entries = project.entries as MerkleEntry[];
    const treeResult = buildMerkleTree(entries);

    return {
      slug: project.slug,
      merkleRoot: project.merkleRoot as Hex,
      entries,
      tree: treeResult.tree,
      createdAt: project.createdAt,
    };
  }

  async saveProject(data: ProjectData): Promise<void> {
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, data.slug.toLowerCase()));

    if (existing.length > 0) {
      await db
        .update(projects)
        .set({
          merkleRoot: data.merkleRoot,
          entries: data.entries as AllowlistEntry[],
          treeData: JSON.stringify({ root: data.merkleRoot }),
          createdAt: data.createdAt,
        })
        .where(eq(projects.slug, data.slug.toLowerCase()));
    } else {
      await db.insert(projects).values({
        slug: data.slug.toLowerCase(),
        merkleRoot: data.merkleRoot,
        entries: data.entries as AllowlistEntry[],
        treeData: JSON.stringify({ root: data.merkleRoot }),
        createdAt: data.createdAt,
      });
    }
  }

  async getAllProjects(): Promise<ProjectData[]> {
    const allProjects = await db.select().from(projects);

    return allProjects.map((project) => {
      const entries = project.entries as MerkleEntry[];
      const treeResult = buildMerkleTree(entries);

      return {
        slug: project.slug,
        merkleRoot: project.merkleRoot as Hex,
        entries,
        tree: treeResult.tree,
        createdAt: project.createdAt,
      };
    });
  }
}

export const storage = new DatabaseStorage();
