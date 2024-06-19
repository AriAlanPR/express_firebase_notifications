var express = require('express');
const admin = require('firebase-admin');
var router = express.Router();
var serviceAccount = require('../firebase_config/notificaciones-2be2a-firebase-adminsdk-po8ha-c5eed88ce4.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  const notification = {
    notification: {
      title: "api test",
      body: "api background test"
    },
    token: 'x1'
  };

  admin.messaging().send(notification).then((response) => {
    console.log("notification delivered", response);
    return res.status(200).json({message: `Notification sent: ${response}`})
  }).catch((error) => {
    return res.status(500).json({message: `Error in notification: ${JSON.stringify(error)}`});
  });
  // res.send('respond with a firebase resource');
});

module.exports = router;