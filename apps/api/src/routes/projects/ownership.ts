import { projectsRepo } from "@bother-me-not/db";

// Returns null for a missing project and for someone else's project alike, so callers
// answer 404 either way and never reveal that another user's project id exists.
export async function requireOwnedProject(id: string, userId: string) {
    const project = await projectsRepo.findById(id);
    if (!project || project.userId !== userId) {
        return null;
    }
    return project;
}
