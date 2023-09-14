/** @param {import("../..").NS } ns */
export async function main(ns) {
    if (!self.sleeveClaims) {
        ns.exit()
    }

    for (const claim of Object.values(self.sleeveClaims.claims)) {
        ns.tprintf("%s %s %j", claim.id, claim.owner, claim.task)
    }
    ns.tprintf("unclaimed: %s", self.sleeveClaims.unclaimed.length)
}
