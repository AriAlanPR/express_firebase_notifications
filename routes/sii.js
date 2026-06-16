var express = require('express');
const admin = require('../services/firebaseAdmin');
const http = require('http');
const https = require('https');
var router = express.Router();

const SII_NOTIFICATION_TYPE = 'sii_notification';

const siiNotificationPresets = {
  classification_request_rejected: {
    title: 'Solicitud Rechazada',
    body: 'Tu solicitud de clasificación fue descartada.',
  },
  traffic_entry_created: {
    title: 'Nueva entrada de tráfico',
    body: 'Se notificó una nueva entrada de almacén.',
  },
  communication_created: {
    title: 'Nueva Comunicación',
    body: 'Tienes una nueva comunicación disponible.',
  },
  pedimento_created: {
    title: 'Estatus de Pedimento Actualizado',
    body: 'El pedimento {{pedimento}} tiene una actualización de estatus.',
  },
};

/**
 * Resolves pedimento value from accepted aliases in the request body.
 *
 * @param {import('express').Request} req Express request.
 * @returns {string|null} Pedimento value when available.
 */
function resolvePedimento(req) {
  const pedimento = req.body.pedimento || req.body.actionPayload || req.body.resourceId;

  if (pedimento === undefined || pedimento === null || pedimento === '') {
    return null;
  }

  return String(pedimento);
}

/**
 * Builds the same human-readable body used by TraficoWeb for pedimento updates.
 *
 * @param {string|null} pedimento Pedimento number.
 * @returns {string} Notification body for mobile clients.
 */
function buildPedimentoStatusBody(pedimento) {
  if (!pedimento) {
    return 'El pedimento recibido tiene una actualización de estatus.';
  }

  return `El pedimento ${pedimento} tiene una actualización de estatus.`;
}

function resolveTraficoRequestConfig(req) {
  const traficoBaseUrl = req.body.traficoBaseUrl || process.env.TRAFICO_BASE_URL;
  const passportToken = req.body.passportToken || process.env.TRAFICO_PASSPORT_TOKEN;
  const fcmToken = req.body.fcm_token || req.body.fcmToken || req.body.deviceId || req.body.token;

  if (!traficoBaseUrl) {
    const error = new Error('traficoBaseUrl or TRAFICO_BASE_URL is required');
    error.status = 400;
    throw error;
  }

  if (!passportToken) {
    const error = new Error('passportToken or TRAFICO_PASSPORT_TOKEN is required');
    error.status = 400;
    throw error;
  }

  if (!fcmToken) {
    const error = new Error('fcm_token, fcmToken, deviceId, or token is required');
    error.status = 400;
    throw error;
  }

  return {
    traficoBaseUrl: traficoBaseUrl.replace(/\/$/, ''),
    passportToken,
    fcmToken,
    deviceType: req.body.device_type || req.body.deviceType || 'ios',
  };
}

function resolveGenericTraficoRequestConfig(req) {
  const traficoBaseUrl = req.body.traficoBaseUrl || process.env.TRAFICO_BASE_URL;
  const passportToken = req.body.passportToken || process.env.TRAFICO_PASSPORT_TOKEN;
  const method = String(req.body.method || 'POST').toUpperCase();
  const path = req.body.path;

  if (!traficoBaseUrl) {
    const error = new Error('traficoBaseUrl or TRAFICO_BASE_URL is required');
    error.status = 400;
    throw error;
  }

  if (!path || typeof path !== 'string' || !path.startsWith('/')) {
    const error = new Error('path is required and must start with /');
    error.status = 400;
    throw error;
  }

  return {
    traficoBaseUrl: traficoBaseUrl.replace(/\/$/, ''),
    passportToken,
    method,
    path,
    body: req.body.body || {},
  };
}

function sendHttpJsonRequest({ baseUrl, path, method, body, passportToken }, callback) {
  const requestBody = JSON.stringify(body || {});
  const url = new URL(`${baseUrl}${path}`);
  const transport = url.protocol === 'https:' ? https : http;
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody),
  };

  if (passportToken) {
    headers.Authorization = `Bearer ${passportToken}`;
  }

  const options = {
    method,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    headers,
  };

  const proxyRequest = transport.request(options, function(proxyResponse) {
    let responseBody = '';

    proxyResponse.on('data', function(chunk) {
      responseBody += chunk;
    });

    proxyResponse.on('end', function() {
      let parsedBody = responseBody;

      try {
        parsedBody = responseBody ? JSON.parse(responseBody) : null;
      } catch (error) {
        parsedBody = responseBody;
      }

      callback(null, {
        statusCode: proxyResponse.statusCode,
        response: parsedBody,
      });
    });
  });

  proxyRequest.on('error', function(error) {
    callback(error);
  });

  proxyRequest.write(requestBody);
  proxyRequest.end();
}

function sendTraficoTokenRequest(method, req, res) {
  let config;

  try {
    config = resolveTraficoRequestConfig(req);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }

  const requestBody = method === 'PUT'
    ? { fcm_token: config.fcmToken, device_type: config.deviceType }
    : { fcm_token: config.fcmToken };
  return sendHttpJsonRequest({
    baseUrl: config.traficoBaseUrl,
    path: '/v2/auth/sii/fcm-token',
    method,
    body: requestBody,
    passportToken: config.passportToken,
  }, function(error, result) {
    if (error) {
      return res.status(500).json({
        message: 'Error calling TraficoWeb',
        error: error.message,
      });
    }

    return res.status(result.statusCode).json({
      message: method === 'PUT'
        ? 'TraficoWeb token registration request completed'
        : 'TraficoWeb token removal request completed',
      statusCode: result.statusCode,
      request: {
        method,
        url: `${config.traficoBaseUrl}/v2/auth/sii/fcm-token`,
        body: requestBody,
      },
      response: result.response,
    });
  });
}

function sendGenericTraficoRequest(req, res) {
  let config;

  try {
    config = resolveGenericTraficoRequestConfig(req);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }

  return sendHttpJsonRequest({
    baseUrl: config.traficoBaseUrl,
    path: config.path,
    method: config.method,
    body: config.body,
    passportToken: config.passportToken,
  }, function(error, result) {
    if (error) {
      return res.status(500).json({
        message: 'Error calling TraficoWeb',
        error: error.message,
      });
    }

    return res.status(result.statusCode).json({
      message: 'TraficoWeb custom request completed',
      statusCode: result.statusCode,
      request: {
        method: config.method,
        url: `${config.traficoBaseUrl}${config.path}`,
        body: config.body,
      },
      response: result.response,
    });
  });
}

/**
 * Builds the same SII Mobile FCM shape sent by TraficoWeb.
 *
 * All values in the FCM data map are strings because Firebase Admin rejects
 * non-string data values and sii-movil reads these fields directly as strings.
 */
function buildSiiNotification(req, actionType) {
  const token = req.body.deviceId || req.body.token || req.body.fcmToken;
  const preset = siiNotificationPresets[actionType] || {};
  const pedimento = actionType === 'pedimento_created' ? resolvePedimento(req) : null;
  const title = req.body.title || preset.title || 'Nueva Comunicación';
  const body = req.body.body
    || (actionType === 'pedimento_created'
      ? buildPedimentoStatusBody(pedimento)
      : preset.body)
    || 'Tienes una nueva notificación.';
  const actionPayload = actionType === 'pedimento_created'
    ? (pedimento || `pedimento-${Date.now()}`)
    : (req.body.actionPayload || req.body.resourceId || `test-${Date.now()}`);
  const perfilId = req.body.perfilId === undefined || req.body.perfilId === null
    ? ''
    : String(req.body.perfilId);

  if (!token) {
    const error = new Error('deviceId, token, or fcmToken is required');
    error.status = 400;
    throw error;
  }

  return {
    message: {
      notification: {
        title,
        body,
      },
      data: {
        id: String(req.body.id || req.body.userId || 'sii-test-user'),
        title: String(title),
        body: String(body),
        type: SII_NOTIFICATION_TYPE,
        timestamp: String(req.body.timestamp || new Date().toISOString()),
        actionType: String(actionType),
        actionPayload: String(actionPayload),
        perfilId,
      },
      token,
    },
  };
}

function sendSiiNotification(req, res, actionType) {
  let payload;

  try {
    payload = buildSiiNotification(req, actionType);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }

  return admin.messaging().send(payload.message).then((response) => {
    console.log('SII notification delivered', response, payload.message.data);
    return res.status(200).json({
      message: `Notification sent: ${response}`,
      actionType,
      payload: payload.message,
    });
  }).catch((error) => {
    return res.status(500).json({ message: `Error in notification: ${JSON.stringify(error)}` });
  });
}

router.get('/presets', function(req, res) {
  return res.status(200).json({
    actionTypes: Object.keys(siiNotificationPresets),
    body: {
      deviceId: 'required FCM token, also accepts token or fcmToken',
      actionPayload: 'optional resource id used by sii-movil navigation',
      pedimento: 'optional alias for actionPayload on pedimento notifications',
      perfilId: 'optional destination profile id; empty string simulates unknown profile',
      title: 'optional visible title override',
      body: 'optional visible body override',
    },
  });
});

router.post('/traficoweb/register-token', function(req, res) {
  return sendTraficoTokenRequest('PUT', req, res);
});

router.post('/traficoweb/remove-token', function(req, res) {
  return sendTraficoTokenRequest('DELETE', req, res);
});

router.post('/traficoweb/request', function(req, res) {
  return sendGenericTraficoRequest(req, res);
});

router.post('/send', function(req, res) {
  const actionType = req.body.actionType;

  if (!actionType || !siiNotificationPresets[actionType]) {
    return res.status(400).json({
      message: 'Valid actionType is required',
      actionTypes: Object.keys(siiNotificationPresets),
    });
  }

  return sendSiiNotification(req, res, actionType);
});

router.post('/classification-request-rejected', function(req, res) {
  return sendSiiNotification(req, res, 'classification_request_rejected');
});

router.post('/traffic-entry-created', function(req, res) {
  return sendSiiNotification(req, res, 'traffic_entry_created');
});

router.post('/communication-created', function(req, res) {
  return sendSiiNotification(req, res, 'communication_created');
});

router.post('/pedimento-created', function(req, res) {
  return sendSiiNotification(req, res, 'pedimento_created');
});

router.post('/pedimento-status-changed', function(req, res) {
  return sendSiiNotification(req, res, 'pedimento_created');
});

module.exports = router;