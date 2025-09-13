// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retained this comment after all edits.
//
// <BEGIN_EXACT_CODE>
const {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} = require("@paypal/paypal-server-sdk");

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
                process.env.NODE_ENV === "production"
                  ? Environment.Production
                  : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

async function createPaypalOrder(req, res) {
  try {
    const { amount, currency, intent } = req.body;

    // Validar amount en pesos MXN
    const amountInPesos = parseFloat(amount);
    if (!amountInPesos || isNaN(amountInPesos) || amountInPesos <= 0) {
      return res
        .status(400)
        .json({
          error: "Cantidad inválida. Debe ser un número positivo.",
        });
    }

    if (amountInPesos < 10) {
      return res
        .status(400)
        .json({ error: "Cantidad mínima requerida es $10 MXN" });
    }

    if (amountInPesos > 50000) {
      return res
        .status(400)
        .json({ error: "Cantidad máxima permitida es $50,000 MXN" });
    }

    if (!currency || currency.toUpperCase() !== 'MXN') {
      return res
        .status(400)
        .json({ error: "Moneda debe ser MXN" });
    }

    if (!intent || intent !== 'CAPTURE') {
      return res
        .status(400)
        .json({ error: "Intent debe ser CAPTURE" });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

async function capturePaypalOrder(req, res) {
  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

async function loadPaypalDefault(req, res) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}

module.exports = {
  createPaypalOrder,
  capturePaypalOrder,
  loadPaypalDefault
};
// <END_EXACT_CODE>