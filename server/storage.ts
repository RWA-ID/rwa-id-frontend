import type { MerkleEntry } from "./merkle";
import { buildMerkleTree } from "./merkle";
import type { Hex } from "viem";
import type { MerkleTree } from "merkletreejs";
import { sqlite } from "./db";

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

interface ProjectRow {
  id: number;
  slug: string;
  merkle_root: string;
  entries: string;
  tree_data: string;
  created_at: number;
}

export class DatabaseStorage implements IStorage {
  async getProject(slug: string): Promise<ProjectData | undefined> {
    const stmt = sqlite.prepare("SELECT * FROM projects WHERE slug = ?");
    const row = stmt.get(slug.toLowerCase()) as ProjectRow | undefined;

    if (!row) {
      return undefined;
    }

    const entries = JSON.parse(row.entries) as MerkleEntry[];
    const treeResult = buildMerkleTree(entries);

    return {
      slug: row.slug,
      merkleRoot: row.merkle_root as Hex,
      entries,
      tree: treeResult.tree,
      createdAt: row.created_at,
    };
  }

  async saveProject(data: ProjectData): Promise<void> {
    const entriesJson = JSON.stringify(data.entries);
    const treeDataJson = JSON.stringify({ root: data.merkleRoot });

    const existing = sqlite
      .prepare("SELECT id FROM projects WHERE slug = ?")
      .get(data.slug.toLowerCase()) as { id: number } | undefined;

    if (existing) {
      sqlite
        .prepare(
          "UPDATE projects SET merkle_root = ?, entries = ?, tree_data = ?, created_at = ? WHERE slug = ?"
        )
        .run(
          data.merkleRoot,
          entriesJson,
          treeDataJson,
          data.createdAt,
          data.slug.toLowerCase()
        );
    } else {
      sqlite
        .prepare(
          "INSERT INTO projects (slug, merkle_root, entries, tree_data, created_at) VALUES (?, ?, ?, ?, ?)"
        )
        .run(
          data.slug.toLowerCase(),
          data.merkleRoot,
          entriesJson,
          treeDataJson,
          data.createdAt
        );
    }
  }

  async getAllProjects(): Promise<ProjectData[]> {
    const stmt = sqlite.prepare("SELECT * FROM projects");
    const rows = stmt.all() as ProjectRow[];

    return rows.map((row) => {
      const entries = JSON.parse(row.entries) as MerkleEntry[];
      const treeResult = buildMerkleTree(entries);

      return {
        slug: row.slug,
        merkleRoot: row.merkle_root as Hex,
        entries,
        tree: treeResult.tree,
        createdAt: row.created_at,
      };
    });
  }
}

export const storage = new DatabaseStorage();
