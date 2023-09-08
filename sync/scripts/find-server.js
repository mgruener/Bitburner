import {
    Network,
} from "lib/network.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var hostnames = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets", "w0r1d_d43m0n"]
    if (ns.args.length > 0) {
        hostnames = ns.args
    }

    const network = new Network(ns)
    network.findServer(hostnames).forEach(element => {
        ns.tprintf("%s", element)
    });
}

export function autocomplete(data, args) {
    return [...data.servers];
}