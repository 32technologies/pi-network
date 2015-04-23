var fs = require('fs');
var lineReader = require('line-reader');

var PiNetwork = function(resolveConfPath, networkInterfacesPath) {
	this._resolveConfPath = resolveConfPath || '/etc/resolv.conf';
	this._networkInterfacesPath = networkInterfacesPath || '/etc/network/interfaces';
};

PiNetwork.prototype.nameservers = function(callback) {

	var servers = [];

	lineReader.eachLine(this._resolveConfPath, function(line, last) {
		var parts = line.split(' ');
		servers.push(parts[1]);

		if (last) {
			callback(servers);
		}
	});
};

PiNetwork.prototype.usesDhcp = function(callback) {

	var dhcp = false;

	lineReader.eachLine(this._networkInterfacesPath, function(line, last) {
		if (line === 'iface eth0 inet dhcp') {
			dhcp = true;
		}

		if (last) {
			callback(dhcp);
		}
	});
};

PiNetwork.prototype.address = function(callback) {
	this.matchInterfacesLine('address ', function(value) {
		callback(value);	
	});
};

PiNetwork.prototype.netmask = function(callback) {
	this.matchInterfacesLine('netmask ', function(value) {
		callback(value);
	});
};

PiNetwork.prototype.gateway = function(callback) {
	this.matchInterfacesLine('gateway ', function(value) {
		callback(value);
	});
};

PiNetwork.prototype.test = function(value) {

	console.log(this._resolveConfPath);
	console.log(this._networkInterfacesPath);

	return value;
};

PiNetwork.prototype.matchInterfacesLine = function(match, callback) {
	var matched;
	lineReader.eachLine(this._networkInterfacesPath, function(line, last) {
		 if (line.startsWith(match)) {
		 	var parts = line.split(' ');
		 	matched = parts[1];
		 }

		 if (last) {
		 	callback(matched);
		 }
	});
};

PiNetwork.prototype.writeInterfaces = function(dhcp, address, netmask, gateway) {
	var wstream = fs.createWriteStream(this._networkInterfacesPath);
	wstream.write(getLoopbackLines());
	wstream.write(geteth0Line(dhcp));

	if (dhcp === false) {
		wstream.write(getStaticLines(address, netmask, gateway));
	}

	wstream.write(getWlanLines());

	wstream.end();
};

PiNetwork.prototype.writeNameservers = function(first, second) {
	var wstream = fs.createWriteStream(this._resolveConfPath);

	if (first === undefined) {
		throw new Error('First nameserver must be defined');
	}

	wstream.write('nameserver ' + first + '\n');

	if (second !== undefined) {
		wstream.write('nameserver ' + second);
	}

	wstream.end();
};

function getWlanLines() {
	return 'allow-hotplug wlan0\niface wlan0 inet manual\nwpa-roam /etc/wpa_supplicant/wpa_supplicant.conf\niface default inet dhcp';
}

function getStaticLines(address, netmask, gateway) {
	var line = 'address ' + address + '\nnetmask ' + netmask + '\ngateway ' + gateway + '\n\n';
	return line;	 
}

function geteth0Line(dhcp) {
	var type = 'dhcp';

	if (dhcp === false) {
		type = 'static';
	}

	var line = 'iface eth0 inet ' + type + '\n';

	return line;	
}

function getLoopbackLines() {
	return "auto lo\n\niface lo inet loopback\n";
}

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str) {
		return this.slice(0, str.length) == str;
	};
}

module.exports = PiNetwork;