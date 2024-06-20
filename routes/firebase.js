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
      // content_available: true,
      title: "api test",
      body: "api background test",
    },
    "data": {
      "url": "https://example.com",
      "timestamp": "1718783875",
      "content_available": "true"
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
  // res.send('respond with a firebase resource');
});

module.exports = router;
