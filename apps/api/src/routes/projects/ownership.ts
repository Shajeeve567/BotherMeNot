import { projectsRepo } from "@bother-me-not/db";

// Returns null for a missing project and for someone else's project alike, so callers
// answer 404 either way and never reveal that another user's project id exists.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireOwnedProject(id: string, userId: string) {
    // a malformed id would make Postgres throw (a 500); it can't match anything, so it's a 404
    if (!UUID.test(id)) return null;
    const project = await projectsRepo.findById(id);
    if (!project || project.userId !== userId) {
        return null;
    }
    return project;
}
