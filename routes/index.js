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
    const today = (new Date()).getTime();
    const exp_date = (today + (365 * 24 * 60 * 60 * 1000)).toString(); //sum a year
    let loginResponse = {
        token_type: 'Bearer',
        access_token: 'AT-HA70JSM123456',
        expires_at: exp_date.toString(),
        token_id: 'HA70JSM11111',
    };

    res.status(200).json(loginResponse);
});

router.post('/api/auth/setDevice', function(req, res) {
    console.log(req.body);
    let response = req.body;

    response = JSON.stringify(response);

    res.status(200).json(response);
});

router.post('/api/auth/muleros/getDetalleApp/:id', function(req, res, next) {
    console.log(`req.params: ${JSON.stringify(req.params)}`);
    console.log(`req body: ${JSON.stringify(req.body)}`);

    let detalles = {
        "id": req.params.id,
        "url": "http://btrack-r.delbravo.tech/muleros",
        "fecha": (new Date()).getTime().toString(),
        "caja": "4893022",
        "transportista": "lorem ipsum",
        "origen": "similique quaerat totam",
        "destino": "est est consequatur"
    };

    res.json({
        CajasAsignadasMovimiento: detalles
    });
});

router.post('/api/auth/muleros/getListApp', function(req, res, next) {
    console.log(req.body);

    let listado = [
        {
            "caja": "0294856",
            "status": "En proceso de carga",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/1",
            "web_url": "https://btrack.org/mulero",
            "status_color": "#37ad5a"
        },
        {
            "caja": "1958594",
            "status": "En proceso de descarga",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/2",
            "web_url": "https://btrack.org/mulero",
            "status_color": "#e01021"
        },
        {
            "caja": "5419345",
            "status": "En proceso de carga",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/3",
            "web_url": "https://btrack-r.delbravo.tech/mulero",
            "status_color": "#37ad5a"
        },
        {
            "caja": "3412938",
            "status": "Finalizado",
            "api_url_detalle": "http://192.168.10.105:3000/api/auth/muleros/getDetalleApp/4",
            "web_url": "https://btrack-r.delbravo.tech/mulero",
            "status_color": "#2e8274"
        },
    ];

    res.json({
        list: listado
    });
});

module.exports = router;
