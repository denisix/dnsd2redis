# dnsd2redis
Simple DNS server that handle zone and logs all queries to redis database. Based on https://github.com/colmsjo/redis-dns.git

# Configuration
open index.js and configure `const config`:

 const config = {
    dns: {
        interface: "0.0.0.0",		// or your server IP address to bind to
        port: 53,					// yes we want to listen to DNS queries
        zone: "zone.my-domain.com", // your domain name here
 		ns1: "ns1.zone.my-domain.com", // we are NS1
 		ns2: "ns2.zone.my-domain.com", // .. and NS2
 		ttl:	3600,
 		gather_cnt: 10,		// answer after only 10 queries reached our DNS (this will allow us to gather some DNS servers used by the client, i.e. DNS leak)
 		a: '3.4.5.6',		// and then answer as IN A 3.4.5.6
    },
 	records: {	// here our static records
 		"a.zone.my-domain.com": "2.3.4.5",		// a.zone.my-domain.com IN A 2.3.4.5
 		"b.zone.my-domain.com": "1.2.3.4",
 	},
    redis: { // your redis server host & port here
        "host": "127.0.0.1",
        "port": 6379,
    }
 };


# Usage
 nodejs ./index.js
