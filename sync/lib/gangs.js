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

    ascend() {
        var ignoreStats = ["respect"]
        if (this.#gang.api.getGangInformation().isHacking) {
            ignoreStats = ["respect", "agi", "def", "dex", "str"]
        }
        var ascensionBlocker = this.ascensionBlocker(ignoreStats)
        if (ascensionBlocker != "") {
            this.#gang.ns.printf("Not ascending %s because of %s", this.#name, ascensionBlocker)
            return
        }
        this.#gang.api.ascendMember(this.#name)
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
        this.#doTask("Terrorism")
    }

    ransomware() {
        this.#doTask("Ransomware")
    }
    phishing() {
        this.#doTask("Phishing")
    }
    identityTheft() {
        this.#doTask("Identity Theft")
    }
    ddosAttacks() {
        this.#doTask("DDoS Attacks")
    }
    plantVirus() {
        this.#doTask("Plant Virus")
    }
    frautAndCounterfeiting() {
        this.#doTask("Fraud & Counterfeiting")
    }
    moneyLaundering() {
        this.#doTask("Money Laundering")
    }
    cyberterrorism() {
        this.#doTask("Cyberterrorism")
    }
    ethicalHacking() {
        this.#doTask("Ethical Hacking")
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

    ascensionBlocker(ignore = ["respect"]) {
        var mults = this.#gang.api.getAscensionResult(this.#name)
        if (mults) {
            for (const stat of Object.keys(mults)) {
                if (ignore.includes(stat)) {
                    continue
                }
                if (mults[stat] <= 1) {
                    return stat
                }
            }
        }
        return ""
    }

    get name() {
        return this.#name
    }

    get info() {
        return this.#gang.api.getMemberInformation(this.#name)
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
        this.recruitMembers()
        this.buyEquipment()
        this.task("trainCharisma")
        await this.ns.sleep(120000)
        this.task("trainHacking")
        await this.ns.sleep(120000)
        if (this.#api.getGangInformation().isHacking) {
            this.task("moneyLaundering")
            await this.ns.sleep(900000)
            this.task("cyberterrorism")
            await this.ns.sleep(900000)
        } else {
            this.task("trainCombat")
            await this.ns.sleep(120000)
            this.task("humanTrafficking")
            await this.ns.sleep(900000)
            this.task("terrorism")
            await this.ns.sleep(900000)
        }
        this.buyEquipment("Augmentation")
        this.recruitMembers()
        if (this.#api.getGangInformation().wantedPenalty < WANTED_PENALTY_LIMIT) {
            await this.reduceWantedLevel()
        }
        this.task("ascend")
    }

    recruitMembers() {
        while (this.#api.canRecruitMember()) {
            let member = new GangMember(this)
            this.#api.recruitMember(member.name)
            this.#members[member.name] = member
        }
    }

    buyEquipment(equipType = "all") {
        this.#ns.print("Buying equipment for gang")
        var equipmentCost = {}
        for (const name of this.#api.getEquipmentNames()) {
            if ((equipType == "all") || (this.#api.getEquipmentType(name) == equipType)) {
                equipmentCost[name] = this.#api.getEquipmentCost(name)
            }
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
        var task = "vigilanteJuistice"
        if (this.#api.getGangInformation().isHacking) {
            task = "ethicalHacking"
        }
        while ((this.#api.getGangInformation().wantedPenalty < 1) && (this.#api.getGangInformation().wantedLevel > 1)) {
            this.task(task)
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

    task(task = isRequired("task")) {
        for (const member of Object.values(this.#members)) {
            member[task]()
        }
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
