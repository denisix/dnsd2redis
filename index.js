#!/usr/bin/env node
var dnsd = require('dnsd');
var redis = require('redis');

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

const redisClient = redis.createClient(config.redis.port, config.redis.host).on('connect', () => {
    console.info('- connected to redis');
}).on('error', err => {
    console.error('- cannot connect to Redis, error', err);
});


const server = dnsd.createServer((req, res) => {
    const question = res.question[0];
    const hostname = question.name;
	var ttl = config.dns.ttl;

    console.info('-> IN %s:%s/%s type [%s] Q[%j]', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, question.type, question);

	if (question.type === 'NS') {
		res.answer.push({ name: config.dns.zone, type: 'NS', data: config.dns.ns1, ttl });
		res.answer.push({ name: config.dns.zone, type: 'NS', data: config.dns.ns2, ttl });

    	console.info('<- NS %s:%s/%s', req.connection.remoteAddress, req.connection.remotePort, req.connection.type);
   	    res.end();
	}


	if (question.type === 'AAAA') {
		// in such case we do not want ip6
   	    res.end();
	}
	
	if (question.type === 'A') {

		redisClient.sadd(`q:${hostname}`, req.connection.remoteAddress, function() {});

		if (hostname in config.records) {
			ttl = 60;
		    var answer = {
      	            name: hostname,
          	        type: 'A',
              	    data: config.records[hostname],
                  	ttl
       		};
	
        	res.answer.push(answer);
   		    console.info('<- STATIC RECORD %s:%s/%s A[%j]', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, answer);
    		res.end();
		} else {

	        // answer after only config.redis.gather_cnt queries reached
    	    redisClient.get(`cnt:${hostname}`, (redisErr, redisRes) => {
        	    if (redisErr) console.log('- redis error: '+ redisErr);
	            if (redisRes !== null && redisRes.length > 0 && redisRes > config.dns.gather_cnt) {
				    ttl = Math.floor(Math.random() * 60);

				    var answer = {
						name: hostname,
						type: 'A',
						data: config.dns.a,
						ttl
					};

		        	res.answer.push(answer);
		    	    console.info('<- %s:%s/%s A[%j]', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, answer);
    		    	res.end();
				} else {
					if (redisRes == null) redisRes = 1;
					console.log("\t ["+ hostname +"] = "+redisRes);
					redisClient.set(`cnt:${hostname}`, parseInt(redisRes)+1);
				}
			});
		}
    }
});

console.log(`- Server running at ${config.dns.interface}:${config.dns.port}`);
server.zone(config.dns.zone, config.dns.ns1, 'us@' + config.dns.zone, 'now', '2h', '30m', '2w', '10m').listen(config.dns.port, config.dns.interface);

process.on('exit', () => {
    console.info('- shutting down DNS server.');
    console.info('- closing redis connection.');
    redisClient.quit();
});
