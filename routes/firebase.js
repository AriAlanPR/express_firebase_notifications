require('dotenv').config();
var express = require('express');
const admin = require('firebase-admin');
var router = express.Router();
//notificaciones firebase de prueba
// var serviceAccount = require(`../firebase_config/${process.env.FIREBASE_TEST}`);
//notificaciones firebase de prueba 2
var serviceAccount = require(`../firebase_config/${process.env.FIREBASE_PROD}`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  const tokentest = '';
  const tokenrelease = '';
  const notification = {
    notification: {
      title: "Nuevo movimiento de caja",
      body: "Favor de revisar los movimientos pendientes.",
    },
    "data": {
      "url": "https://btrack-r.delbravo.tech/muleros",
      "timestamp": "1718783875",
    },
    token: tokenrelease,
  };

  admin.messaging().send({
    ...notification,
    token: tokentest
  });

  admin.messaging().send(notification).then((response) => {
    console.log("notification delivered", response);
    return res.status(200).json({message: `Notification sent: ${response}`})
  }).catch((error) => {
    return res.status(500).json({message: `Error in notification: ${JSON.stringify(error)}`});
  });
});

router.post('/', function(req, res) {
  console.log("Got a request body::", req.body);

  const token = req.body.deviceId;
  const notification = {
    notification: {
      title: "Nuevo movimiento de caja",
      body: "Favor de revisar los movimientos pendientes.",
    },
    "data": {
      "url": "https://btrack-r.delbravo.tech/muleros",
      "timestamp": "1718783875",
    },
    token: token,
  };

  admin.messaging().send(notification).then((response) => {
    console.log("notification delivered", response);
    return res.status(200).json({message: `Notification sent: ${response}`})
  }).catch((error) => {
    return res.status(500).json({message: `Error in notification: ${JSON.stringify(error)}`});
  });
});

module.exports = router;
