import {
    Network,
} from "lib/network.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var network = new Network(ns)
    network.findServer(ns.args).forEach(element => {
        ns.tprintf("%s", element)
    });
}

export function autocomplete(data, args) {
    return [...data.servers];
}