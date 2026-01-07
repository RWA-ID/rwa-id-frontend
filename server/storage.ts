import type { MerkleEntry } from "./merkle";
import type { Hex } from "viem";

export interface ProjectData {
  slug: string;
  merkleRoot: Hex;
  entries: MerkleEntry[];
  createdAt: number;
}

export interface IStorage {
  getProject(slug: string): Promise<ProjectData | undefined>;
  saveProject(data: ProjectData): Promise<void>;
  getAllProjects(): Promise<ProjectData[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, ProjectData>;

  constructor() {
    this.projects = new Map();
  }

  async getProject(slug: string): Promise<ProjectData | undefined> {
    return this.projects.get(slug.toLowerCase());
  }

  async saveProject(data: ProjectData): Promise<void> {
    this.projects.set(data.slug.toLowerCase(), data);
  }

  async getAllProjects(): Promise<ProjectData[]> {
    return Array.from(this.projects.values());
  }
}

export const storage = new MemStorage();
