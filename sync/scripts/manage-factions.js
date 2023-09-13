import * as factions from "lib/factions.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    // always start with tiandihui
    const tiandihui = new factions.TianDiHui(ns)
    if (tiandihui.canFullfillRequirements()) {
        await tiandihui.fullfillRequirements()
        while (!tiandihui.joined()) {
            ns.sleep(1000)
            tiandihui.join()
        }
        ns.tprintf("Available sleeves: %d", self.sleeveClaims.unclaimed.length)
        if (!tiandihui.haveAllAugs() && (self.sleeveClaims.unclaimed.length > 0)) {
            if (!tiandihui.haveMaxAugRep()) {
                tiandihui.increaseReputation()
            }
        }
    }

    // decide which group of citiy factions we want to join
    // based on the augs we already own
    // the default fallback case are the asian cities
    let cityFactions = []
    const cities1 = ["Sector12", "Aevum"]
    const cities2 = ["Volhaven"]
    const cities3 = ["Chongqing", "NewTokyo", "Ishima"]
    const playerAugs = ns.singularity.getOwnedAugmentations(true).filter((a) => !a.startsWith("NeuroFlux Governor"))

    if (!(playerAugs.includes("CashRoot") && playerAugs.includes("PCMatrix"))) {
        cityFactions = cities1
    } else if (!playerAugs.includes("DermaForce")) {
        cityFactions = cities2
    } else {
        cityFactions = cities3
    }

    for (const name of cityFactions) {
        ns.tprintf("Faction name: %s", name)
        const faction = new factions[name](ns)
        if (faction.canFullfillRequirements()) {
            await faction.fullfillRequirements()
            while (!faction.joined()) {
                ns.sleep(1000)
                faction.join()
            }
            ns.tprintf("Available sleeves: %d", self.sleeveClaims.unclaimed.length)
            if (self.sleeveClaims.unclaimed.length <= 0) {
                ns.tprintf("All sleeves occupied, not increasing reputation for: %s", faction.name)
                continue
            }
            if (!faction.haveAllAugs()) {
                if (!faction.haveMaxAugRep()) {
                    faction.increaseReputation()
                }
            }
        }
    }

    const criminalFactions = [
        "SlumSnakes",
        "Tetrads",
        // "Silhouette",
        "SpeakersForTheDead",
        "TheDarkArmy",
        "TheSyndicate"

    ]

    for (const name of criminalFactions) {
        if (ns.gang.inGang() && (ns.gang.getGangInformation().faction == name)) {
            continue
        }
        const faction = new factions[name](ns)
        if (faction.canFullfillRequirements()) {
            await faction.fullfillRequirements()
            while (!faction.joined()) {
                ns.sleep(1000)
                faction.join()
            }
            ns.tprintf("Available sleeves: %d", self.sleeveClaims.unclaimed.length)
            if (self.sleeveClaims.unclaimed.length <= 0) {
                ns.tprintf("All sleeves occupied, not increasing reputation for: %s", faction.name)
                continue
            }
            if (!faction.haveAllAugs()) {
                if (!faction.haveMaxAugRep()) {
                    faction.increaseReputation()
                }
            }
        }
    }

    const megacorpFactions = [
        "ECorp",
        "MegaCorp",
        "KuaiGongInternational",
        "FourSigma",
        "NWO",
        "BladeIndustries",
        "OmniTekIncorporated",
        "BachmanAndAssociates",
        "ClarkeIncorporated",
        "FulcrumSecretTechnologies"
    ]

    for (const name of megacorpFactions) {
        const faction = new factions[name](ns)
        faction.join()
        ns.tprintf("Available sleeves: %d", self.sleeveClaims.unclaimed.length)
        if (self.sleeveClaims.unclaimed.length <= 0) {
            ns.tprintf("All sleeves occupied, not increasing reputation for: %s", faction.name)
            return
        }
        await faction.fullfillRequirements()
        if (!faction.haveAllAugs()) {
            if (!faction.haveMaxAugRep()) {
                faction.increaseReputation()
            }
        }
    }

}
