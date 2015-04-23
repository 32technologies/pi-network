var PiNetwork = require('./index.js');

var network = new PiNetwork('/home/eric/test-interfaces/resolv.conf', '/home/eric/test-interfaces/interfaces');

network.nameservers(function(servers) {
	console.log(servers);
});

network.usesDhcp(function(val) {
	if (val) {
		console.log('uses dhcp');
	} 
	else {
		console.log('static ip');
	}
});

network.address(function(val) {
	console.log(val);
});

network.netmask(function(val) {
	console.log(val);
});

network.gateway(function(val) {
	console.log(val);
});

network.writeInterfaces(false, '192.168.0.200', '255.255.255.0', '192.168.1.1');
//network.writeInterfaces(true);

network.writeNameservers('8.8.8.8');