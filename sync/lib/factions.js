import {
    Server,
} from "lib/server.js";

import {
    SleeveArmy,
} from "lib/sleeves.js";

export class Faction {
    #ns
    #army
    #sleeveClaims
    #shouldMoney
    #shouldSkills
    #shouldKill
    #shouldKarma
    #incompatibleFactions

    /**
     * @param {import("../..").NS } ns
     * @param {import("sleeves.js").SleeveArmy } army
     */
    constructor(ns, army, shouldMoney, shouldSkills, shouldKarma, shouldKill, incompatibleFactions) {
        this.#ns = ns
        this.#army = army
        if (!this.#army) {
            this.#army = new SleeveArmy(ns)
        }
        this.#sleeveClaims = {}
        this.#army.ownedClaims(this.constructor.name).forEach(claim => {
            this.#sleeveClaims[claim.task.type]
        })
        this.#shouldMoney = shouldMoney
        this.#shouldSkills = shouldSkills
        this.#shouldKill = shouldKill
        this.#shouldKarma = shouldKarma
        this.#incompatibleFactions = incompatibleFactions

        this.join()
    }

    get ns() {
        return this.#ns
    }

    get army() {
        return this.#army
    }

    get sleeveClaims() {
        return this.#sleeveClaims
    }

    static get name() { return "" }
    static get location() { return "" }
    static get server() { return "" }

    canFullfillRequirements() {
        if (this.#incompatibleFactions) {
            const factions = this.ns.getPlayer().factions
            this.#incompatibleFactions.forEach(faction => {
                if (factions.includes(faction)) {
                    return false
                }
            })
        }
        return true
    }

    requirementsFullfilled() {
        if (!this.canFullfillRequirements()) {
            return false
        }
        if (this.#shouldKarma) {
            const karma = this.ns.heart.break()
            if (karma > this.#shouldKarma) {
                return false
            }
        }
        const player = this.ns.getPlayer()
        if (this.#shouldMoney) {
            const money = player.money
            if (money < this.#shouldMoney) {
                return false
            }
        }
        if (this.constructor.location) {
            const location = player.location
            if (location != this.constructor.location) {
                return false
            }
        }
        if (this.#shouldSkills) {
            Object.keys(this.#shouldSkills).forEach(skill => {
                if (player.skills[skill] < this.#shouldSkills[skill]) {
                    return false
                }
            })
        }
        if (this.#shouldKill) {
            if (player.numPeopleKilled < this.#shouldKill) {
                return false
            }
        }
    }

    increaseReputation() {
        this.playerIncreaseReputation()
        this.sleevesIncreaseReputation()
    }

    playerIncreaseReputation(workType) {
        if (!this.joined()) {
            return
        }
        const actualWorkType = workType ? workType : "security"
        const currentWork = this.ns.singularity.getCurrentWork()
        this.#ns.tprintf("Personally increasing reputation for: %s (%s)", this.constructor.name, actualWorkType)

        // check if we are already working for this faction
        if ((currentWork.type == "FACTION") && (currentWork.factionName == this.constructor.name) && (currentWork.factionWorkType == actualWorkType)) {
            return
        }
        this.ns.singularity.workForFaction(this.constructor.name, actualWorkType, false)
    }

    sleevesIncreaseReputation(workType) {
        if (!this.joined()) {
            return
        }

        let claim = this.sleeveClaims["FACTION"]
        const actualWorkType = workType ? workType : "security"
        this.#ns.tprintf("Tasking a sleeve to  increase reputation for: %s (%s)", this.constructor.name, actualWorkType)
        // we already have a sleeve that is doing the expected work for the faction
        // no need to do anything
        if (claim && (claim.task["factionWorkType"] == actualWorkType)) {
            return
        }

        // we already have a sleeve working for this faction, but it is not doing
        // the right work so we need to release the claim so we can change the task of the
        // sleeve
        if (claim) {
            claim.release()
        }
        claim = this.army.setToFactionWork(this.constructor.name, actualWorkType, this.constructor.name)
        if (!claim) {
            this.#ns.tprintf("No sleeve available")
        }
        this.#sleeveClaims["FACTION"] = claim
    }

    async fullfillRequirements() {
        this.#ns.tprintf("Fullfilling requirements for: %s", this.constructor.name)
        if (!this.joined()) {
            this.travel()
            return
        }
        this.#ns.tprintf("  Already joined: %s", this.constructor.name)
    }

    join() {
        if (this.joined()) {
            return true
        }
        if (!this.#ns.singularity.checkFactionInvitations().includes(this.constructor.name)) {
            this.#ns.tprintf("No faction invitation for: %s", this.constructor.name)
            return false
        }
        this.#ns.tprintf("Joining: %s", this.constructor.name)
        return this.ns.singularity.joinFaction(this.constructor.name)
    }

    joined() {
        return this.ns.getPlayer().factions.includes(this.constructor.name)
    }

    travel() {
        if (this.constructor.location != "") {
            this.#ns.tprintf("Traveling to: %s (%s)", this.constructor.location, this.constructor.name)
            this.ns.singularity.travelToCity(this.constructor.location)
        }
    }

    connect() {
        if (this.constructor.server != "") {
            this.#ns.tprintf("Connecting to server: %s (%s)", this.constructor.location, this.constructor.name)
            const server = new Server(this.ns, this.constructor.server)
            server.connect()
        }
    }

    haveAllAugs() {
        const factionAugs = this.#ns.singularity.getAugmentationsFromFaction(this.constructor.name).filter((a) => !a.startsWith("NeuroFlux Governor"))
        const playerAugs = this.#ns.singularity.getOwnedAugmentations(true).filter((a) => !a.startsWith("NeuroFlux Governor"))

        factionAugs.forEach(factionAug => {
            if (!playerAugs.includes(factionAug)) {
                return false
            }
        })
    }

    haveMaxAugRep() {
        const rep = this.#ns.singularity.getFactionRep(this.constructor.name)
        const factionAugs = this.#ns.singularity.getAugmentationsFromFaction(this.constructor.name).filter((a) => !a.startsWith("NeuroFlux Governor"))
        const playerAugs = this.#ns.singularity.getOwnedAugmentations(true).filter((a) => !a.startsWith("NeuroFlux Governor"))

        factionAugs.forEach(aug => {
            const requiredRep = this.#ns.singularity.getAugmentationRepReq(aug)
            if (!playerAugs.includes(aug) && (requiredRep > rep)) {
                return false
            }
        })
    }
}

// Early Game Factions
export class TianDiHui extends Faction {
    static get name() { return "Tian Di Hui" }
    static get location() { return Chongqing.name }

    constructor(ns, army) {
        const money = 1000000
        const skills = {
            "hacking": 50,
        }
        super(ns, army, money, skills)
    }
}

export class Netburners extends Faction {
    static get name() { return "Netburners" }
}

export class ShadowsOfAnarchy extends Faction {
    static get name() { return "Shadows of Anarchy" }
}

// City Factions
export class Sector12 extends Faction {
    static get name() { return "Sector-12" }
    static get location() { return Sector12.name }

    constructor(ns, army) {
        const money = 15000000
        const incompatibleFactions = [
            Chongqing.name,
            NewTokyo.name,
            Ishima.name,
            Volhaven.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }

}

export class Aevum extends Faction {
    static get name() { return "Aevum" }
    static get location() { return Aevum.name }

    constructor(ns, army) {
        const money = 40000000
        const incompatibleFactions = [
            Chongqing.name,
            NewTokyo.name,
            Ishima.name,
            Volhaven.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }
}

export class Chongqing extends Faction {
    static get name() { return "Chongqing" }
    static get location() { return Chongqing.name }

    constructor(ns, army) {
        const money = 20000000
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }
}

export class NewTokyo extends Faction {
    static get name() { return "New Tokyo" }
    static get location() { return NewTokyo.name }

    constructor(ns, army) {
        const money = 20000000
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }
}

export class Ishima extends Faction {
    static get name() { return "Ishima" }
    static get location() { return Ishima.name }

    constructor(ns, army) {
        const money = 30000000
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }
}

export class Volhaven extends Faction {
    static get name() { return "Volhaven" }
    static get location() { return Volhaven.name }

    constructor(ns, army) {
        const money = 50000000
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Chongqing.name,
            NewTokyo.name,
            Ishima.name
        ]
        super(ns, army, money, null, null, null, incompatibleFactions)
    }
}

// Hacking Groups
export class HackingFaction extends Faction {
    requirementsFullfilled() {
        if (!super.requirementsFullfilled()) {
            return false
        }
        const server = this.ns.getServer(this.constructor.server)
        return server.backdoorInstalled
    }

    async fullfillRequirements() {
        if (!this.joined()) {
            const server = new Server(this.ns, this.constructor.server)
            await server.crack()
        }
    }

    playerIncreaseReputation(workType) {
        super.playerIncreaseReputation(workType ? workType : "hacking")
    }

    sleevesIncreaseReputation(workType) {
        super.sleevesIncreaseReputation(workType ? workType : "hacking")
    }
}

export class CyberSec extends HackingFaction {
    static get name() { return "CyberSec" }
    static get server() { return "CSEC" }
}

export class NiteSec extends HackingFaction {
    static get name() { return "NiteSec" }
    static get server() { return "avmnite-02h" }
}

export class TheBlackHand extends HackingFaction {
    static get name() { return "The Black Hand" }
    static get server() { return "I.I.I.I" }

    playerIncreaseReputation(workType) {
        super.playerIncreaseReputation(workType ? workType : "field")
    }

    sleevesIncreaseReputation(workType) {
        super.sleevesIncreaseReputation(workType ? workType : "field")
    }
}

export class BitRunners extends HackingFaction {
    static get name() { return "BitRunners" }
    static get server() { return "run4theh111z" }
}

// Megacorporations
export class MegaCorporation extends Faction {
    requirementsFullfilled() {
        if (!super.requirementsFullfilled()) {
            return false
        }
        return (this.ns.singularity.getCompanyRep(this.constructor.name) >= 400000)
    }

    async fullfillRequirements() {
        super.fullfillRequirements()
        if (!this.joined()) {
            // try to start working for this company or try to get an promotion
            this.ns.singularity.applyToCompany(this.constructor.name, "Security")
            const currentWork = this.ns.singularity.getCurrentWork()

            // if we are not currently working for this company, start working for it
            if (!((currentWork.type == "COMPANY") && (currentWork.companyName == this.constructor.name))) {
                this.ns.singularity.workForCompany(this.constructor.name, false)
            }

            // if none of our sleeves is currently working for this company, instruct one to work for it
            if (!this.sleeveClaims["COMPANY"]) {
                const claim = this.army.setToCompanyWork(this.constructor.name, this.constructor.name)
                this.sleeveClaims["COMPANY"] = claim
            }
        }
    }

    playerIncreaseReputation(workType) {
        super.playerIncreaseReputation(workType ? workType : "security")
    }

    sleevesIncreaseReputation(workType) {
        if (this.sleeveClaims["COMPANY"]) {
            this.sleeveClaims["COMPANY"].release()
        }
        super.sleevesIncreaseReputation(workType ? workType : "security")
    }
}

export class ECorp extends MegaCorporation {
    static get name() { return "ECorp" }
    static get location() { return Aevum.name }
    static get server() { return "ecorp" }
}

export class MegaCorp extends MegaCorporation {
    static get name() { return "MegaCorp" }
    static get location() { return Sector12.name }
    static get server() { return "megacorp" }
}

export class KuaiGongInternational extends MegaCorporation {
    static get name() { return "KuaiGong International" }
    static get location() { return Chongqing.name }
    static get server() { return "kuai-gong" }
}

export class FourSigma extends MegaCorporation {
    static get name() { return "Four Sigma" }
    static get location() { return Sector12.name }
    static get server() { return "4sigma" }
}

export class NWO extends MegaCorporation {
    static get name() { return "NWO" }
    static get location() { return Volhaven.name }
    static get server() { return "nwo" }
}

export class BladeIndustries extends MegaCorporation {
    static get name() { return "Blade Industries" }
    static get location() { return Sector12.name }
    static get server() { return "blade" }
}

export class OmniTekIncorporated extends MegaCorporation {
    static get name() { return "OmniTek Incorporated" }
    static get location() { return Volhaven.name }
    static get server() { return "omnitek" }
}

export class BachmanAndAssociates extends MegaCorporation {
    static get name() { return "Bachman & Associates" }
    static get location() { return Aevum.name }
    static get server() { return "b-and-a" }
}

export class ClarkeIncorporated extends MegaCorporation {
    static get name() { return "Clarke Incorporated" }
    static get location() { return Aevum.name }
    static get server() { return "clarkinc" }
}

export class FulcrumSecretTechnologies extends MegaCorporation {
    static get name() { return "Fulcrum Secret Technologies" }
    static get location() { return Aevum.name }
    static get server() { return "fulcrumtech" }

    requirementsFullfilled() {
        const reputationFullfilled = super.requirementsFullfilled()
        const server = this.ns.getServer("fulcrumassets")
        return server.backdoorInstalled && reputationFullfilled
    }

    async fullfillRequirements() {
        super.fullfillRequirements()
        if (!this.joined()) {
            const server = new Server(this.ns, "fulcrumassets")
            await server.crack()
        }
    }
}

export class CriminalOrganization extends Faction {
    async fullfillRequirements() {
        super.fullfillRequirements()
        if (!this.joined()) {
            this.reduceKarma()
        }
    }

    reduceKarma() {
        if (this.ns.heart.break() > this.constructor.karma) {
            this.ns.singularity.commitCrime("homicide", false)
        }
    }
}

// Criminal Organizations
export class SlumSnakes extends CriminalOrganization {
    static get name() { return "Slum Snakes" }
    static get karma() { return -9 }

    constructor(ns, army) {
        const karma = -9
        const money = 1000000
        const combatLevel = 30
        const skills = {
            "agility": combatLevel,
            "defense": combatLevel,
            "dexterity": combatLevel,
            "strength": combatLevel,
        }
        super(ns, army, money, skills, karma)
    }
}
export class Tetrads extends CriminalOrganization {
    static get name() { return "Tetrads" }
    static get location() { return Chongqing.name }

    constructor(ns, army) {
        const karma = -18
        const money = null
        const combatLevel = 75
        const skills = {
            "agility": combatLevel,
            "defense": combatLevel,
            "dexterity": combatLevel,
            "strength": combatLevel,
        }
        super(ns, army, money, skills, karma)
    }
}
export class Silhouette extends CriminalOrganization {
    static get name() { return "Silhouette" }

    constructor(ns, army) {
        const karma = -22
        const money = 15000000
        super(ns, army, money, null, karma)
    }

    requirementsFullfilled() {
        if (!super.requirementsFullfilled()) {
            return false
        }
        // TODO: check if we are CTO, CFO or CEO of a company
    }

    async fullfillRequirements() {
        super.fullfillRequirements()

        // TODO: become CTO, CFO or CEO of a company
    }
}
export class SpeakersForTheDead extends CriminalOrganization {
    static get name() { return "Speakers for the Dead" }

    constructor(ns, army) {
        const karma = -45
        const money = null
        const combatLevel = 300
        const skills = {
            "hacking": 100,
            "agility": combatLevel,
            "defense": combatLevel,
            "dexterity": combatLevel,
            "strength": combatLevel,
        }
        const shouldKill = 30
        const incompatibleFactions = ["NSA", "CIA"]
        super(ns, army, money, skills, karma, shouldKill, incompatibleFactions)
    }
}
export class TheDarkArmy extends CriminalOrganization {
    static get name() { return "The Dark Army" }
    static get location() { return Chongqing.name }

    constructor(ns, army) {
        const karma = -45
        const money = null
        const combatLevel = 300
        const skills = {
            "hacking": 300,
            "agility": combatLevel,
            "defense": combatLevel,
            "dexterity": combatLevel,
            "strength": combatLevel,
        }
        const shouldKill = 5
        const incompatibleFactions = ["NSA", "CIA"]
        super(ns, army, money, skills, karma, shouldKill, incompatibleFactions)
    }

}
export class TheSyndicate extends CriminalOrganization {
    static get name() { return "The Syndicate" }
    static get location() { return Aevum.name }

    constructor(ns, army) {
        const karma = -90
        const money = 10000000
        const combatLevel = 200
        const skills = {
            "hacking": 200,
            "agility": combatLevel,
            "defense": combatLevel,
            "dexterity": combatLevel,
            "strength": combatLevel,
        }
        const incompatibleFactions = ["NSA", "CIA"]
        super(ns, army, money, skills, karma, null, incompatibleFactions)
    }
}

// Endgame Factions
export class TheCovenant extends Faction {
    static get name() { return "The Covenant" }
}
export class Daedalus extends Faction {
    static get name() { return "Daedalus" }
}
export class Illuminati extends Faction {
    static get name() { return "Illuminati" }
}