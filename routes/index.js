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
    let detalles = {
        "url": "http://btrack.org",
        "fecha_destino": (1719242472331).toString(),
        "caja": "QF04TEC",
        "origen": "similique quaerat totam",
        "destino": "est est consequatur"
    };

    res.json(detalles);
});

router.get('/muleros/api/list', function(req, res, next) {
    console.log(req.query);
    let listado = [
        {
            "caja": "HA70JSM",
            "status": "c",
            "api_url_detalle": "https://btrack.org/muleros/api/detalle/<ID>",
            "web_url": "https://btrack.org/mulero"
        },
        {
            "caja": "LD30OLK",
            "status": "a",
            "api_url_detalle": "https://btrack.org/muleros/api/detalle/<ID>",
            "web_url": "https://btrack.org/mulero"
        }
    ];

    res.json(listado);
});

router.post('/', function(req, res){
    console.log(req.body);

    res.json(req.body);
});

router.post('/api/auth/login', function(req, res) {
    console.log(req.body);
    let loginResponse = {
        token_type: 'Bearer',
        access_token: 'HA70JSM123456',
        expires_at: (new Date()).getTime().toString(),
        token_id: 'HA70JSM11111',
    };

    // loginResponse = JSON.stringify(loginResponse);

    res.json(loginResponse);
});

router.post('/api/auth/setDevice', function(req, res) {
    console.log(req.body);
    let response = req.body;

    response = JSON.stringify(response);

    res.status(200).json(response);
});

module.exports = router;
