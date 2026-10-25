import { z } from "zod";

// GitHub ids are numeric; as strings they stay exact and can't smuggle in path segments.
const githubId = z.string().regex(/^\d{1,20}$/, "Must be a numeric id");

export const connectRepoSchema = z.object({
  installationId: githubId,
  repoId: githubId,
});

export const listReposQuerySchema = z.object({
  installationId: githubId,
});

export type ConnectRepoBody = z.infer<typeof connectRepoSchema>;
