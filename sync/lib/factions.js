import {
    Server,
} from "lib/server.js";

import {
    SleeveArmy,
} from "lib/sleeves.js";

export class Faction {
    #ns
    #army

    /** @param {import("../..").NS } ns */
    constructor(ns) {
        this.#ns = ns
        this.#army = new SleeveArmy(ns)
        this.join()
    }

    get ns() {
        return this.#ns
    }

    get army() {
        return this.#army
    }

    static get name() { return "" }
    static get location() { return "" }
    static get server() { return "" }

    canFullfillRequirements() { return true }
    requirementsFullfilled() { return false }

    increaseReputation() {
        this.playerIncreaseReputation()
        this.sleevesIncreaseReputation()
    }

    playerIncreaseReputation() { }
    sleevesIncreaseReputation() { }

    async fullfillRequirements() { }

    join() {
        return this.ns.singularity.joinFaction(this.name)
    }

    travel() {
        if (this.location != "") {
            this.ns.singularity.travelToCity(this.location)
        }
    }

    connect() {
        if (this.server != "") {
            const server = new Server(this.ns, this.server())
            server.connect()
        }
    }
}

// Early Game Factions
export class CyberSec extends Faction {
    static get name() { return "CyberSec" }
    static get server() { return "CSEC" }

    requirementsFullfilled() {
        const server = this.ns.getServer(this.server())
        return server.backdoorInstalled
    }

    async fullfillRequirements() {
        const server = new Server(this.ns, this.server())
        await server.crack()
    }

    playerIncreaseReputation() {
        this.ns.singularity.workForFaction(this.name, "hacking", false)
    }
}

export class TianDiHui extends Faction {
    static get name() { return "Tian Di Hui" }
    static get location() { return Chongqing.name }
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

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Chongqing.name,
            NewTokyo.name,
            Ishima.name,
            Volhaven.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

export class Aevum extends Faction {
    static get name() { return "Aevum" }
    static get location() { return Aevum.name }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Chongqing.name,
            NewTokyo.name,
            Ishima.name,
            Volhaven.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

export class Chongqing extends Faction {
    static get name() { return "Chongqing" }
    static get location() { return Chongqing.name }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

export class NewTokyo extends Faction {
    static get name() { return "New Tokyo" }
    static get location() { return NewTokyo.name }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

export class Ishima extends Faction {
    static get name() { return "Ishima" }
    static get location() { return Ishima.name }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Volhaven.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

export class Volhaven extends Faction {
    static get name() { return "Volhaven" }
    static get location() { return Volhaven.name }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        const incompatibleFactions = [
            Sector12.name,
            Aevum.name,
            Chongqing.name,
            NewTokyo.name,
            Ishima.name
        ]
        incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }
}

// Hacking Groups
export class NiteSec extends Faction {
    static get name() { return "NiteSec" }
    static get server() { return "avmnite-02h" }
}

export class TheBlackHand extends Faction {
    static get name() { return "The Black Hand" }
    static get server() { return "I.I.I.I" }
}

export class BitRunners extends Faction {
    static get name() { return "BitRunners" }
    static get server() { return "run4theh111z" }
}

// Megacorporations
export class ECorp extends Faction {
    static get name() { return "ECorp" }
    static get location() { return Aevum.name }
    static get server() { return "ecorp" }
}

export class MegaCorp extends Faction {
    static get name() { return "MegaCorp" }
    static get location() { return Sector12.name }
    static get server() { return "megacorp" }
}

export class KuaiGongInternational extends Faction {
    static get name() { return "KuaiGong International" }
    static get location() { return Chongqing.name }
    static get server() { return "kuai-gong" }
}

export class FourSigma extends Faction {
    static get name() { return "Four Sigma" }
    static get location() { return Sector12.name }
    static get server() { return "4sigma" }
}

export class NWO extends Faction {
    static get name() { return "NWO" }
    static get location() { return Volhaven.name }
    static get server() { return "nwo" }
}

export class BladeIndustries extends Faction {
    static get name() { return "Blade Industries" }
    static get location() { return Sector12.name }
    static get server() { return "blade" }
}

export class OmniTekIncorporated extends Faction {
    static get name() { return "OmniTek Incorporated" }
    static get location() { return Volhaven.name }
    static get server() { return "omnitek" }
}

export class BachmanAndAssociates extends Faction {
    static get name() { return "Bachman & Associates" }
    static get location() { return Aevum.name }
    static get server() { return "b-and-a" }
}

export class ClarkeIncorporated extends Faction {
    static get name() { return "Clarke Incorporated" }
    static get location() { return Aevum.name }
    static get server() { return "clarkinc" }
}

export class FulcrumSecretTechnologies extends Faction {
    static get name() { return "Fulcrum Secret Technologies" }
    static get location() { return Aevum.name }
    static get server() { return "fulcrumtech" }
}

// Criminal Organizations
export class SlumSnakes extends Faction {
    static get name() { return "Slum Snakes" }
}
export class Tetrads extends Faction {
    static get name() { return "Tetrads" }
    static get location() { return Chongqing.name }
}
export class Silhouette extends Faction {
    static get name() { return "Silhouette" }
}
export class SpeakersForTheDead extends Faction {
    static get name() { return "Speakers for the Dead" }
}
export class TheDarkArmy extends Faction {
    static get name() { return "The Dark Army" }
    static get location() { return Chongqing.name }
}
export class TheSyndicate extends Faction {
    static get name() { return "The Syndicate" }
    static get location() { return Aevum.name }
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