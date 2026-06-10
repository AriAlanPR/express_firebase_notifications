require('dotenv').config();

const admin = require('firebase-admin');

// Firebase Admin debe inicializarse una sola vez aunque varios routers lo usen.
const serviceAccount = require(`../firebase_config/${process.env.FIREBASE_PROD}`);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;