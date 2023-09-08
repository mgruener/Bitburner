import {
    Network,
} from "lib/network.js";

import {
    portOpener,
} from "lib/utils.js";

import {
    Darkweb,
} from "lib/darkweb.js";

export class Server {
    #ns
    #server
    #hostname
    #network

    /**
     * @param {import("../..").NS } ns
     * @param {string } hostname
     */
    constructor(ns, hostname) {
        this.#ns = ns
        this.#hostname = hostname
        this.#update()
    }

    async crack() {
        // the server has been opened up as much as possible, we are done here
        if (this.#server.backdoorInstalled) {
            return true
        }

        // we already have admin rights, try to backdoor the server
        if (this.#server.hasAdminRights) {
            return await this.#backdoor()
        }

        // we do not have admin rights, maybe we can get them
        if (this.#nuke) {
            // we succeeded in getting admin rights, lets try
            // installing a backdoor on the server
            return await this.#backdoor()
        }

        // we failed even with getting admin rights
        return false
    }

    connect() {
        this.network().goToServer(this.#hostname)
    }

    network(network) {
        this.#network = network
        if (!this.#network) {
            this.#network = new Network(this.#ns)
        }
        return this.#network
    }

    async #backdoor() {
        const player = this.#ns.getPlayer()
        if (player.skills.hacking < this.#server.requiredHackingSkill) {
            return false
        }

        this.connect()
        await this.#ns.singularity.installBackdoor()
        this.#ns.singularity.connect("home")
        return true
    }

    #nuke() {

        // check if the server has enough open ports to be nuked
        // and if not, try to open as many ports as possible
        if (this.#server.openPortCount < this.#server.numOpenPortsRequired) {
            // before we try to open additional ports, check if we can buy additional
            // port opener programs
            const darkweb = new Darkweb(this.#ns)
            darkweb.buyPortOpener()

            // open as many ports as possible
            const po = portOpener(ns)
            for (let attack of po) {
                if (attack["check"](this.#server)) {
                    attack["func"](this.#hostname)
                }
            }
        }
        // nuke the server
        // because nuke() has no return value, we use the hasAdminRights
        this.#ns.nuke(this.#hostname)
        return this.#update().hasAdminRights
    }

    #update() {
        this.#server = ns.getServer(this.#hostname)
        return this.#server
    }
}