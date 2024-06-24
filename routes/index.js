var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log(req.query);

    res.render('index', {
        title: 'Test Node REST Services View',
        data: JSON.stringify(req.query)
    });
});

router.get('/muleros/api/detalle', function(req, res, next) {
    console.log(req.query);
    detalles = {
        "url": "http://gaetano.info",
        "fecha_destino": 1719242472331,
        "caja": "QF04TEC",
        "origen": "similique quaerat totam",
        "destino": "est est consequatur"
    };

    res.json(detalles);
});

router.get('/muleros/api/list', function(req, res, next) {
    console.log(req.query);
    detalles = [
        {
            "caja": "HA70JSM",
            "status": "c",
            "api_url_detalle": "https://geraldine.org",
            "web_url": "http://destiny.name"
        },
        {
            "caja": "LD30OLK",
            "status": "a",
            "api_url_detalle": "https://krystel.org",
            "web_url": "http://krystina.biz"
        }
    ];

    res.json(detalles);
});

router.post('/', function(req, res){
    console.log(req.body);

    res.json(req.body);
});

module.exports = router;
