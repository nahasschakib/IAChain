import { clerkClient } from "@clerk/nextjs/server";

// Vrai si l'organisation n'a plus aucun membre avec le rôle Admin.
// En cas d'erreur Clerk, on répond « faux » : on ne montre jamais le message à tort.
export async function organisationSansAdmin(orgId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });
    return !res.data.some((m) => m.role === "org:admin");
  } catch {
    return false;
  }
}