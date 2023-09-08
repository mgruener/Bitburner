import {
    Network,
} from "lib/network.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var target = "w0r1d_d43m0n"
    if (ns.args.length > 0) {
        target = ns.args[0]
    }
    var network = new Network(ns)
    network.goToServer(target)
}

export function autocomplete(data, args) {
    return [...data.servers];
}