import {
    Server,
} from "lib/server.js";

import {
    SleeveArmy,
} from "lib/sleeves.js";

export class Faction {
    #ns
    #army

    /**
     * @param {import("../..").NS } ns
     * @param {import("sleeves.js").SleeveArmy } army
     */
    constructor(ns, army) {
        this.#ns = ns
        this.#army = army
        if (!this.#army) {
            this.#army = new SleeveArmy(ns)
        }
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

    playerIncreaseReputation(workType) {
        if (!this.joined()) {
            return
        }
        this.ns.singularity.workForFaction(this.constructor.name, workType, false)
    }
    sleevesIncreaseReputation(workType) {
        if (!this.joined()) {
            return
        }
        this.army.setToFactionWork(this.constructor.name, workType ? workType : "security")
    }

    async fullfillRequirements() { }

    join() {
        if (this.joined()) {
            return true
        }
        return this.ns.singularity.joinFaction(this.constructor.name)
    }

    joined() {
        return this.ns.getPlayer().factions.includes(this.constructor.name)
    }

    travel() {
        if (this.constructor.location != "") {
            this.ns.singularity.travelToCity(this.constructor.location)
        }
    }

    connect() {
        if (this.constructor.server != "") {
            const server = new Server(this.ns, this.constructor.server)
            server.connect()
        }
    }
}

// Early Game Factions
export class TianDiHui extends Faction {
    static get name() { return "Tian Di Hui" }
    static get location() { return Chongqing.name }

    requirementsFullfilled() {
        const moneyNeeded = 1000000
        const hackingNeeded = 50
        const player = this.ns.getPlayer()
        const hacking = player.skills.hacking
        const money = player.money
        const location = player.location
        return (money == moneyNeeded) && (hacking == hackingNeeded) && (location == this.constructor.location)
    }

    async fullfillRequirements() {
        if (!this.joined()) {
            this.travel()
        }
    }
}

export class Netburners extends Faction {
    static get name() { return "Netburners" }
}

export class ShadowsOfAnarchy extends Faction {
    static get name() { return "Shadows of Anarchy" }
}

// City Factions
export class CityFaction extends Faction {
    #moneyNeeded
    #incompatibleFactions
    constructor(ns, army, moneyNeeded, incompatibleFactions) {
        super(ns, army)
        this.#moneyNeeded = moneyNeeded
        this.#incompatibleFactions = incompatibleFactions
    }

    canFullfillRequirements() {
        const factions = this.ns.getPlayer().factions
        this.#incompatibleFactions.forEach(faction => {
            if (factions.includes(faction)) {
                return false
            }
        })
        return true
    }

    requirementsFullfilled() {
        const player = this.ns.getPlayer()
        const money = player.money
        const location = player.location
        return (money == this.#moneyNeeded) && (location == this.constructor.location)
    }

    async fullfillRequirements() {
        if (!this.joined()) {
            this.travel()
        }
    }
}

export class Sector12 extends CityFaction {
    static get name() { return "Sector-12" }
    static get location() { return Sector12.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            15000000,
            [
                Chongqing.name,
                NewTokyo.name,
                Ishima.name,
                Volhaven.name
            ]
        )
    }

}

export class Aevum extends CityFaction {
    static get name() { return "Aevum" }
    static get location() { return Aevum.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            40000000,
            [
                Chongqing.name,
                NewTokyo.name,
                Ishima.name,
                Volhaven.name
            ]
        )
    }
}

export class Chongqing extends CityFaction {
    static get name() { return "Chongqing" }
    static get location() { return Chongqing.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            20000000,
            [
                Sector12.name,
                Aevum.name,
                Volhaven.name
            ]
        )
    }
}

export class NewTokyo extends CityFaction {
    static get name() { return "New Tokyo" }
    static get location() { return NewTokyo.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            20000000,
            [
                Sector12.name,
                Aevum.name,
                Volhaven.name
            ]
        )
    }
}

export class Ishima extends CityFaction {
    static get name() { return "Ishima" }
    static get location() { return Ishima.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            30000000,
            [
                Sector12.name,
                Aevum.name,
                Volhaven.name
            ]
        )
    }
}

export class Volhaven extends CityFaction {
    static get name() { return "Volhaven" }
    static get location() { return Volhaven.name }

    constructor(ns, army) {
        super(
            ns,
            army,
            50000000,
            [
                Sector12.name,
                Aevum.name,
                Chongqing.name,
                NewTokyo.name,
                Ishima.name
            ]
        )
    }
}

// Hacking Groups
export class HackingFaction extends Faction {
    requirementsFullfilled() {
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
}

export class BitRunners extends HackingFaction {
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