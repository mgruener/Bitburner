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
			let server = ns.getServer(host)
			let scanResult = ns.scan(host)
			knownHosts[host] = server
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
		return ((host.maxRam - host.ramUsed) >= size)
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

export function portOpener(ns) {
	var portOpener = []
	if (ns.fileExists("BruteSSH.exe", "home")) {
		portOpener.push({ "func": ns.brutessh, "check": (s) => !s.sshPortOpen })
	}

	if (ns.fileExists("FTPCrack.exe", "home")) {
		portOpener.push({ "func": ns.ftpcrack, "check": (s) => !s.ftpPortOpen })
	}

	if (ns.fileExists("relaySMTP.exe", "home")) {
		portOpener.push({ "func": ns.relaysmtp, "check": (s) => !s.smtpPortOpen })
	}

	if (ns.fileExists("HTTPWorm.exe", "home")) {
		portOpener.push({ "func": ns.httpworm, "check": (s) => !s.httpPortOpen })
	}

	if (ns.fileExists("SQLInject.exe", "home")) {
		portOpener.push({ "func": ns.sqlinject, "check": (s) => !s.sqlPortOpen })
	}
	return portOpener
}

export function union(...lists) {
	return [...(new Set(lists.flat()))]
}

export function unique(...lists) {
	return lists.flat().filter((v, i, a) => a.indexOf(v) === a.lastIndexOf(v))
}

export function intersection(...lists) {
	var input = [...lists]
	var result = input.shift()
	for (const l of input) {
		result = result.filter(x => l.includes(x))

	}
	return [...(new Set(result))]
}

export function difference(...lists) {
	var input = [...lists]
	var result = input.shift()
	for (const l of input) {
		result = result.filter(x => !l.includes(x))
	}
	return [...(new Set(result))]
}

export function threadsAvailable(ns, threadSize, compensate = false) {
	var adminFilter = filter_adminRights(true)
	var ramFilter = filter_minRamAvailable(threadSize)
	var targets = getAllServers(ns)
	targets = applyFilter(targets, [adminFilter, ramFilter], false, false)

	var threads = 0
	var script = ns.getRunningScript()
	for (const name in targets) {
		let target = targets[name]
		let ramAvailable = target.maxRam - target.ramUsed
		if (compensate) {
			// ensure that the memory usage of this script
			// does not affect our calculation
			if (name == script.server) {
				ramAvailable = ramAvailable + script.ramUsage
			}
		}
		let serverThreads = Math.floor(ramAvailable / threadSize)
		ns.printf("Server threads:")
		ns.printf("  %s (%d)", name, serverThreads)
		threads = threads + serverThreads
	}
	return threads
}

export function getWeakenThreads(ns, server) {
	var targetAmount = Math.max(server.hackDifficulty - server.minDifficulty, 0)
	var weakenThreads = Math.ceil(targetAmount / ns.weakenAnalyze(1))
	return weakenThreads
}

// according to https://steamcommunity.com/app/1812820/discussions/0/5545618081297574632/#c3200369112086161192
// grow() adds $1 for each thread if the server has $0 available so providing
// an estimated thread count, we get a better estimate of actual threads
// needed in that case
export function getGrowThreads(ns, server, threadsAvailable = 1) {
	var money = server.moneyAvailable <= 0 ? Math.max(threadsAvailable, 1) : server.moneyAvailable
	var growFactor = server.moneyMax / money
	return Math.ceil(ns.growthAnalyze(server.hostname, growFactor))
}

export function getHackThreads(ns, server) {
	var money = server.moneyAvailable
	var hackThreads = Math.ceil(ns.hackAnalyzeThreads(server.hostname, money))
	if (isFinite(hackThreads)) {
		return hackThreads
	}
	return 1
}

export async function deployPayload(ns, name) {
	if (name == "home") {
		return
	}
	const files = [
		"/lib/utils.js",
		"/payload/hack-only.js",
		"/payload/grow-only.js",
		"/payload/weaken-only.js",
		"/payload/share.js",
	]
	await ns.scp(files, "home", name)
}

export function getAdditionalServerInfo(ns, server) {
	var moneyThreshold = server.moneyMax * 0.75
	var securityThreshold = server.minDifficulty + 5
	var result = {
		moneyThreshold: moneyThreshold,
		securityThreshold: securityThreshold,
		weakenThreads: getWeakenThreads(ns, server),
		growThreads: getGrowThreads(ns, server, threadsAvailable(ns, 1.75)),
		hackThreads: getHackThreads(ns, server)
	}
	return result
}

export async function buyServers(ns) {
	const minRam = 8
	let prefix = ns.sprintf("pserv-%d", minRam)
	if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
		return true
	}
	let serverCost = ns.getPurchasedServerCost(minRam)
	while (myMoney(ns) >= serverCost) {
		let name = ns.purchaseServer(prefix, minRam);
		await deployPayload(ns, name)
		if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
			return true
		}
	}
	return false
}

export async function upgradeServers(ns, ramLimit = 256) {
	var maxServers = ns.getPurchasedServerLimit()
	// someday
	// var ramLimit = ns.getPurchasedServerMaxRam()
	// only start upgrading if we are already at our maximum server count
	if (ns.getPurchasedServers().length < maxServers) {
		return false
	}
	ns.disableLog("getServerMaxRam")

	var servers = {}
	while (!(ramLimit in servers) || (servers[ramLimit].length < maxServers)) {
		servers = {}
		for (const name of ns.getPurchasedServers()) {
			let ram = ns.getServerMaxRam(name)
			if (ram in servers) {
				servers[ram].push(name)
				continue
			}
			servers[ram] = [name]
		}
		let ramSizes = [...Object.keys(servers)].sort((a, b) => a - b)
		let maxRamSize = ramSizes[ramSizes.length - 1]
		let targetRamSize = Math.min(maxRamSize * 2, ramLimit)
		if (servers[maxRamSize].length < maxServers) {
			targetRamSize = maxRamSize
			ramSizes.pop()
		} else if (maxRamSize == ramLimit) {
			return true
		}
		let prefix = ns.sprintf("pserv-%d", targetRamSize)
		for (const size of ramSizes) {
			for (const name of servers[size]) {
				let upgradeCost = ns.getPurchasedServerCost(targetRamSize)
				if (myMoney(ns) < upgradeCost) {
					// not enough money to further upgrade, stop here
					return false
				}
				ns.killall(name, false)
				ns.deleteServer(name)
				let newName = ns.purchaseServer(prefix, targetRamSize);
				await deployPayload(ns, newName)
			}
		}
	}
	return true
}

export function isRunning(ns, script, args) {
	var procs = ns.ps("home")
	for (const proc of procs) {
		let scriptMatch = false
		let argsMatch = false
		if (proc.filename == script) {
			scriptMatch = true
		}
		argsMatch = arrayEqual(args, proc.args)
	}
}

export function arrayEqual(a, b) {
	if (a.length != b.length) {
		return false
	}
	var _a = [...a].sort()
	var _b = [...b].sort()
	for (var index = 0; index < _a.length; index++) {
		if (_a[index] != _b[index]) {
			return false
		}
	}
	return true
}

export function myMoney(ns) {
	ns.disableLog("getServerMoneyAvailable")
	return ns.getServerMoneyAvailable("home")
}

export function buyHacknetNodes(ns, nodeLimit) {
	if (ns.hacknet.numNodes() >= nodeLimit) {
		return true
	}
	while (myMoney(ns) >= ns.hacknet.getPurchaseNodeCost()) {
		ns.hacknet.purchaseNode()
		if (ns.hacknet.numNodes() >= nodeLimit) {
			return true
		}
	}
	return false
}

export function upgradeHacknetNodes(ns, upgrade) {
	var nodeLimit = upgrade["nodeLimit"]
	var resType = upgrade["type"]
	var resLimit = upgrade["limit"]
	var doUpgrade = upgrade["upgradeFunc"]
	var getCosts = upgrade["costFunc"]
	var curNodes = ns.hacknet.numNodes()
	if (curNodes < nodeLimit) {
		return false
	}

	var nodes = {}
	while (!(resLimit in nodes) || (nodes[resLimit].length < nodeLimit)) {
		nodes = {}
		for (var i = 0; i < curNodes; i++) {
			let res = ns.hacknet.getNodeStats(i)[resType]
			if (res in nodes) {
				nodes[res].push(i)
				continue
			}
			nodes[res] = [i]
		}

		let resValues = [...Object.keys(nodes)].sort((a, b) => a - b)
		let maxResValue = resValues[resValues.length - 1]
		let targetResValue = Math.min(maxResValue + 1, resLimit)
		if (nodes[maxResValue].length < nodeLimit) {
			targetResValue = maxResValue
			resValues.pop()
		} else if (maxResValue == resLimit) {
			return true
		}
		for (const val of resValues) {
			for (const i of nodes[val]) {
				while (ns.hacknet.getNodeStats(i)[resType] != targetResValue) {
					var upgradeCost = getCosts(i, 1);
					if (myMoney(ns) < upgradeCost) {
						// not enough money to further upgrade, stop here
						return false
					}
					doUpgrade(i, 1);
				}
			}
		}
	}
	return true
}

export function getHacknetRamUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 64,
		"type": "ram",
		"costFunc": ns.hacknet.getRamUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeRam,
	}
}

export function getHacknetLevelUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 200,
		"type": "level",
		"costFunc": ns.hacknet.getLevelUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeLevel,
	}
}

export function getHacknetCoreUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 16,
		"type": "cores",
		"costFunc": ns.hacknet.getCoreUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeCore,
	}
}

// set shouldThreads to -1 to automatically determine the number of threads
export async function schedule(ns, script, shouldThreads = 1, args = []) {
	var threads = parseInt(shouldThreads)
	if (threads == 0) {
		ns.tprintf("Failed to schedule '%s': threads must be > 0 or -1, is %d", script, threads)
		return false
	}
	var threadFactor = threads < 0 ? 1 : threads
	var size = ns.getScriptRam(script, "home") * threadFactor
	var hasAdminFilter = filter_adminRights(true)
	var ramFilter = filter_minRamAvailable(size)
	var candidates = applyFilter(getAllServers(ns), [hasAdminFilter, ramFilter], false, false)
	var target = ""
	var targetRamAvail = -1
	for (const name in candidates) {
		let candidateRamAvail = candidates[name].maxRam - candidates[name].ramUsed
		if (candidateRamAvail > targetRamAvail) {
			target = name
			targetRamAvail = candidateRamAvail
		}
	}
	if (target == "") {
		ns.tprintf("Failed to schedule '%s': no usable server found", script)
		return false
	}
	if (target != "home") {
		await ns.scp("/lib/utils.js", "home", target)
		await ns.scp(script, "home", target)
	}
	var maxThreads = Math.floor(targetRamAvail / size)
	var execThreads = threads < 0 ? maxThreads : threads
	return ns.exec(script, target, execThreads, ...args) != 0
}