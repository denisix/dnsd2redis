# dnsd2redis
Simple DNS server that handle zone and logs all queries to redis database. Based on https://github.com/colmsjo/redis-dns.git

## About
this simple DNS server will allow you to gather client's DNS ip addresses (i.e. DNS leak)

## Configuration
open index.js and configure `const config`:

```
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
```

## Usage
start your redis server, then start this node:
```
nodejs ./index.js
```

## Make some queries then..
for example using dig:

- check NS zone
```
dig @YOUR_SERVER_IP -t ns zone.my-domain.com
```

- check your static A-records:
```
dig @YOUR_SERVER_IP a.zone.my-domain.com
dig @YOUR_SERVER_IP b.zone.my-domain.com
```

- check other (unexisting) A-records:
```
dig @YOUR_SERVER_IP example.zone.my-domain.com
```

## Now you can query your redis, using redis-cli for example:
```
redis-cli 
127.0.0.1:6379> smembers q:example.zone.my-domain.com
```
