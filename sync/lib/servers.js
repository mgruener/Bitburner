/** @param {import("../..").NS } ns */
export function getAllServers(ns) {
    // result is a dict of str => Server
    var knownHosts = {}

    // always start scanning at our "home" server
    var entryPoint = "home"
    var hostsToScan = [entryPoint]

    // While we still have hosts eligible to be scanned
    // iterate over all of them, scan them to get the list
    // of other hosts they "see", then remove already known
    // and duplicate hosts. Make the resulting list the new list
    // of hosts eligible to scan
    ns.disableLog("scan")
    while (hostsToScan.length > 0) {
        var scanCandidates = []
        for (const host of hostsToScan) {
            let scanResult = ns.scan(host).filter((h) => h != host)
            knownHosts[host] = { "children": scanResult }
            scanCandidates = scanCandidates.concat(scanResult)
        }

        // create a new list of scan eligible hosts
        // by filtering out all already known and duplicate
        // hosts from the scan candidates
        hostsToScan = []
        for (const candidate of scanCandidates) {
            if (hostsToScan.includes(candidate) || (candidate in knownHosts)) {
                continue
            }
            hostsToScan.push(candidate)
        }
    }
    return knownHosts
}

/** @param {import("../..").NS } ns */
export function findServer(ns, name, node = "home", servers = getAllServers(ns), path = [node]) {
    // found it!
    if (servers[node].hostname == name) {
        return path
    }
    // we have been here before
    if (path.indexOf(node) != (path.length - 1)) {
        return []
    }
    // search all connected nodes
    // note: "children" is an additional server attribute that is added to each
    // server object by the getAllServers() function
    for (const next of servers[node].children) {
        let result = findServer(ns, name, next, servers, [...path, next])
        if (result.length > 0) {
            return result
        }
    }
    return []
}

export function applyFilter(hosts, filter = [], exclude = true, matchAny = true) {
    var results = []
    var hostnames = Object.keys(hosts)
    for (const f of filter) {
        let filterResults = hostnames.filter(name => f(hosts[name]))
        results.push(filterResults)
    }
    var matcher = intersection
    if (matchAny) {
        matcher = union
    }
    var result = {}
    var filtered = matcher(...results)
    if (exclude) {
        filtered = difference(hostnames, filtered)
    }

    for (const name of filtered) {
        result[name] = hosts[name]
    }
    return result
}

export function filter_hostname(regex) {
    var re = new RegExp(sprintf("^%s$", regex))
    return (function (host) {
        return re.test(host.hostname)
    })
}

export function filter_hackingSkill(level) {
    return (function (host) {
        return (level < host.requiredHackingSkill)
    })
}

export function filter_adminRights(adminRightsPresent = true) {
    return (function (host) {
        return (host.hasAdminRights == adminRightsPresent)
    })
}

export function filter_minRam(size) {
    return (function (host) {
        return (host.maxRam >= size)
    })
}

export function filter_minRamAvailable(size) {
    return (function (host) {
        return (ramAvail(host) >= size)
    })
}

export function filter_canNuke(ns = true) {
    var po = portOpener(ns)
    var maxOpenPortsRequired = po.length
    return (function (host) {
        return (host.numOpenPortsRequired <= maxOpenPortsRequired)
    })
}

export function filter_playerServer(state = true) {
    return (function (host) {
        return (host.purchasedByPlayer == state)
    })
}

export function filter_minMaxMoney(amount = 1) {
    return (function (host) {
        return (host.moneyMax >= amount)
    })
}