var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log(req.query);

    res.render('index', {
        title: 'Test Node REST Services View',
        data: JSON.stringify(req.query)
    });
});

router.post('/', function(req, res){
    console.log(req.body);

    res.json(req.body);
});

router.post('/api/auth/login', function(req, res) {
    console.log(req.body);
    let loginResponse = {
        token_type: 'Bearer',
        access_token: 'AT-HA70JSM123456',
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

router.post('/api/auth/muleros/getDetalleApp/:id', function(req, res, next) {
    console.log(`req.params: ${req.params}`);
    console.log(`req body: ${req.body}`);

    let detalles = {
        "id": req.params.id,
        "url": "http://btrack.org",
        "fecha": (1719242472331).toString(),
        "caja": "QF04TEC",
        "transportista": "lorem ipsum",
        "origen": "similique quaerat totam",
        "destino": "est est consequatur"
    };

    res.json(detalles);
});

router.post('/api/auth/muleros/getListApp', function(req, res, next) {
    console.log(req.body);

    let listado = [
        {
            "caja": "HA70JSM",
            "status": "c",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/1",
            "web_url": "https://btrack.org/mulero"
        },
        {
            "caja": "LD30OLK",
            "status": "a",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/2",
            "web_url": "https://btrack.org/mulero"
        },
    ];

    res.json({
        list: listado
    });
});

module.exports = router;
