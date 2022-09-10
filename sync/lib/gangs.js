import {
    canAfford
} from "lib/utils.js";


export const MEMBER_BASENAME = "Joe"
export const HACK_GANGS = ["NiteSec", "The Black Hand"]
export const COMBAT_GANGS = ["Slum Snakes", "Tetrads", "The Syndicate", "The Dark Army", "Speakers for the Dead"]
export const WANTED_PENALTY_LIMIT = 0.98

export class GangMember {
    #name
    #gang
    constructor(gang, name = gang.nextMember()) {
        this.#name = name
        this.#gang = gang
    }

    stopAssignment() {
        this.#doTask("Unassigned")
    }

    mugPeople() {
        this.#doTask("Mug People")
    }

    dealDrugs() {
        this.#doTask("Deal Drugs")
    }

    strongarmCivilians() {
        this.#doTask("Strongarm Civilians")
    }

    runACon() {
        this.#doTask("Run a Con")
    }

    armedRobbery() {
        this.#doTask("Armed Robbery")
    }

    trafficIllegalArms() {
        this.#doTask("Traffick Illegal Arms")
    }

    threatenAndBlackmail() {
        this.#doTask("Threaten & Blackmail")
    }

    humanTrafficking() {
        this.#doTask("Human Trafficking")
    }

    terrorism() {
        this.#doTask("Human Trafficking")
    }

    vigilanteJuistice() {
        this.#doTask("Vigilante Justice")
    }

    trainCombat() {
        this.#doTask("Train Combat")
    }

    trainHacking() {
        this.#doTask("Train Hacking")
    }

    trainCharisma() {
        this.#doTask("Train Charisma")
    }

    territoryWarfare() {
        this.#doTask("Territory Warfare")
    }

    purchase(equipment = isRequired("equipment")) {
        if (this.info.upgrades.includes(equipment) || this.info.augmentations.includes(equipment)) {
            return
        }
        this.#gang.api.purchaseEquipment(this.#name, equipment)
    }

    get name() {
        return this.#name
    }

    get info() {
        this.#gang.api.getMemberInformation(this.#name)
    }

    #doTask(task = isRequired("task")) {
        this.#gang.api.setMemberTask(this.#name, task)
    }
}


export class Gang {
    #ns
    #api
    #members = {}
    constructor(ns, type = "combat") {
        this.#ns = ns
        this.#api = this.#ns.gang
        if (!this.#ns.gang.inGang()) {
            if (!this.#createGang(type)) {
                throw ("Failed to found gang! Available player factions: %s", this.#ns.getPlayer().factions)
            }

        }
        this.#loadMembers()
    }

    async manage() {
        let gangInfo = this.#api.getGangInformation()
        this.recruitMembers()
        if (gangInfo.wantedPenalty < WANTED_PENALTY_LIMIT) {
            await this.reduceWantedLevel()
        }
        this.buyEquipment()
    }

    recruitMembers() {
        while (this.#api.canRecruitMember()) {
            let member = new GangMember(this)
            this.#api.recruitMember(member.name)
            this.#members[member.name] = member
        }
    }

    buyEquipment() {
        this.#ns.print("Buying equipment for gang")
        var equipmentCost = {}
        for (const name of this.#api.getEquipmentNames()) {
            equipmentCost[name] = this.#api.getEquipmentCost(name)
        }

        let sortedEquipment = Object.keys(equipmentCost).sort((a, b) => equipmentCost[a] - equipmentCost[b])
        for (const equipName of sortedEquipment) {
            for (const member of Object.values(this.#members)) {
                if (!canAfford(this.#ns, equipmentCost[equipName])) {
                    return
                }
                member.purchase(equipName)
            }
        }

    }

    async reduceWantedLevel() {
        for (const member of Object.values(this.#members)) {
            member.vigilanteJuistice()
        }
        while (this.#api.getGangInformation().wantedPenalty < 1) {
            await this.#ns.sleep(1000)
        }
    }

    hasMember(name = isRequired("name")) {
        return this.#api.getMemberNames().includes(name)
    }

    nextMember() {
        for (let index = 0; index < 12; index++) {
            let name = `${MEMBER_BASENAME}-${index}`
            if (!this.hasMember(name)) {
                return name
            }
        }
        return ""
    }

    get ns() {
        return this.#ns
    }

    get api() {
        return this.#api
    }

    #createGang(type = isRequired("type")) {
        let gangFactionCandidates = type == "combat" ? COMBAT_GANGS : HACK_GANGS
        for (const gangFaction of gangFactionCandidates) {
            if (this.#ns.getPlayer().factions.includes(gangFaction)) {
                return this.#ns.gang.createGang(gangFaction)
            }
        }
        return false
    }

    #loadMembers() {
        for (const name of this.#api.getMemberNames()) {
            let member = new GangMember(this, name)
            this.#members[member.name] = member
        }
    }
}
