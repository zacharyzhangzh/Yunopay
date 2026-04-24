const express = require('express')
const path = require('path')
const fetch = require('node-fetch')
const v4 = require('uuid').v4
const { getCountryData } = require('./utils')

require('dotenv').config()

let API_URL

// Ask for these keys to sales department
const ACCOUNT_CODE = process.env.ACCOUNT_CODE
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PRIVATE_SECRET_KEY = process.env.PRIVATE_SECRET_KEY

const SERVER_PORT = process.env.PORT || 8080

let CUSTOMER_ID

const staticDirectory = path.join(__dirname, 'vanilla/static')

const indexPage = path.join(__dirname, 'vanilla/pages/index.html')
const checkoutPage = path.join(__dirname, 'vanilla/pages/checkout.html')
const checkoutLitePage = path.join(__dirname, 'vanilla/pages/checkout-lite.html')
const seamlessCheckoutPage = path.join(__dirname, 'vanilla/pages/checkout-seamless.html')
const seamlessCheckoutLitePage = path.join(__dirname, 'vanilla/pages/checkout-seamless-lite.html')
const seamlessExternalButtonsPage = path.join(__dirname, 'vanilla/pages/checkout-seamless-external-buttons.html')
const statusPage = path.join(__dirname, 'vanilla/pages/status.html')
const statusLitePage = path.join(__dirname, 'vanilla/pages/status-lite.html')
const enrollmentLitePage = path.join(__dirname, 'vanilla/pages/enrollment-lite.html')
const checkoutSecureFieldsPage = path.join(__dirname, 'vanilla/pages/checkout-secure-fields.html')
const fullFeatures = path.join(__dirname, 'vanilla/pages/full-features.html')
const paymentMethodsUnfolded = path.join(__dirname, 'vanilla/pages/payment-methods-unfolded.html')

const app = express()

app.use(express.json())

// 静态资源托管配置
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'vanilla')))
app.use('/static', express.static(staticDirectory))

app.get('/', (req, res) => {
  res.sendFile(indexPage)
})

app.get('/checkout', (req, res) => {
  res.sendFile(checkoutPage)
})

app.get('/checkout/lite', (req, res) => {
  res.sendFile(checkoutLitePage)
})

app.get('/checkout/seamless', (req, res) => {
  res.sendFile(seamlessCheckoutPage)
})

app.get('/checkout/seamless/lite', (req, res) => {
  res.sendFile(seamlessCheckoutLitePage)
})

app.get('/checkout/seamless/external-buttons', (req, res) => {
  res.sendFile(seamlessExternalButtonsPage)
})

app.get('/checkout/secure-fields', (req, res) => {
  res.sendFile(checkoutSecureFieldsPage)
})

app.get('/status', (req, res) => {
  res.sendFile(statusPage)
})

app.get('/status-lite', (req, res) => {
  res.sendFile(statusLitePage)
})

app.get('/enrollment-lite', (req, res) => {
  res.sendFile(enrollmentLitePage)
})

app.get('/full-features', (req, res) => {
  res.sendFile(fullFeatures)
})

app.get('/checkout/payment-methods-unfolded', async (req, res) => {
  res.sendFile(paymentMethodsUnfolded)
})

app.post('/checkout/sessions', async (req, res) => {
  const country = req.query.country || 'US' // 默认测试国家改为US
  const { currency } = getCountryData(country)

  const response = await fetch(
    `${API_URL}/v1/checkout/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_order_id: 'ORDER_' + Date.now(), // 动态生成订单号
        payment_description: 'Test MP ' + Date.now(),
        country,
        customer_id: CUSTOMER_ID,
        amount: {
          currency: 'USD',
          value: 11,
        },
      }),
    }
  ).then((resp) => resp.json())

  res.send(response)
})

app.post('/checkout/seamless/sessions', async (req, res) => {
  const country = req.query.country || 'US' // 默认测试国家改为US
  const { currency } = getCountryData(country)

  const response = await fetch(
    `${API_URL}/v1/checkout/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_order_id: 'ORDER_' + Date.now(), // 动态生成订单号
        payment_description: 'Test Seamless Payment',
        country,
        customer_id: CUSTOMER_ID,
        amount: {
          currency: 'USD',
          value: 11,
        },
        workflow: 'SDK_SEAMLESS',
        additional_data: {
          order: {
            shipping_amount: 12,
            fee_amount: 11,
            tip_amount: '12',
            taxes: [
              {
                type: 'VAT',
                tax_base: 123,
                value: 1,
                percentage: 1
              }
            ],
            items: [
              {
                category: 'clothes',
                id: 'ASD',
                name: 'T-Shirt',
                quantity: 1,
                unit_amount: 11,
                brand: 'DemoBrand',
                sku_code: '123123',
                manufacture_part_number: 'SADSADAS'
              }
            ]
          }
          // 👉 已经完全移除了 airline 数据块
        },
        customer_payer: {
          merchant_customer_id: '1',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-02-28',
          email: 'johndoe@y.uno',
          nationality: 'US',
          ip_address: '192.168.123.167',
          device_fingerprint: 'hi88287gbd8d7d782ge',
          browser_info: {
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
            accept_header: 'true',
            color_depth: '15',
            screen_height: '2048',
            screen_width: '1152',
            javascript_enabled: false,
            language: 'en'
          },
          document: {
            document_number: '35104075397',
            document_type: 'ID'
          },
          billing_address: {
            address_line_1: '123 Test Street',
            address_line_2: 'Apt 4',
            city: 'New York',
            country: 'US',
            state: 'NY',
            zip_code: '10001',
            neighborhood: 'Manhattan'
          },
          shipping_address: {
            address_line_1: '123 Test Street',
            address_line_2: 'Apt 4',
            city: 'New York',
            state: 'NY',
            zip_code: '10001',
            neighborhood: 'Manhattan',
            country: 'US'
          },
          phone: {
            country_code: '1',
            number: '5551234567'
          }
        },
        payment_method: {
          detail: {
            card: {
              verify: false,
              capture: true
            }
          },
          vaulted_token: null,
          type: 'CARD',
          vault_on_success: false
        },
        installments: {
          plan: [
            {
              installment: 1,
              rate: 1
            }
          ]
        },
        fraud_screening: {
          stand_alone: false
        },
        metadata: [
          {
            key: 'ID',
            value: 'SD00'
          }
        ]
      }),
    }
  ).then((resp) => resp.json())

  res.send(response)
})

app.post('/payments', async (req, res) => {
  const checkoutSession = req.body.checkoutSession
  const oneTimeToken = req.body.oneTimeToken
  const country = req.query.country || 'US' // 默认测试国家改为US
  const { documentNumber, documentType } = getCountryData(country)

  const response = await fetch(`${API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'public-api-key': PUBLIC_API_KEY,
      'private-secret-key': PRIVATE_SECRET_KEY,
      'X-idempotency-key': v4(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Test Seamless Payment',
      account_id: ACCOUNT_CODE,
      merchant_order_id: 'ORDER_' + Date.now(), // 动态生成订单号
      country,
      additional_data: {
        // 👉 已经完全移除了 airline 数据块
        order: {
          fee_amount: 11,
          items: [
            {
              brand: 'DemoBrand',
              category: 'Clothes',
              id: '123AD',
              manufacture_part_number: 'XYZ123456',
              name: 'T-Shirt',
              quantity: 1,
              sku_code: '8765432109',
              unit_amount: 11,
            },
          ],
          shipping_amount: 12,
        },
      },
      amount: {
        currency: 'USD',
        value: 11, // 和 session 保持一致
      },
      checkout: {
        session: checkoutSession,
      },
      customer_payer: {
        billing_address: {
          address_line_1: '123 Test Street',
          address_line_2: 'Apt 4',
          city: 'New York',
          country: 'US',
          state: 'NY',
          zip_code: '10001',
        },
        date_of_birth: '1990-02-28',
        device_fingerprint: 'hi88287gbd8d7d782ge....',
        document: {
          document_type: documentType,
          document_number: documentNumber,
        },
        email: 'johndoe@y.uno',
        first_name: 'John',
        gender: 'MALE',
        id: CUSTOMER_ID,
        ip_address: '192.168.123.167',
        last_name: 'Doe',
        merchant_customer_id: '1',
        nationality: 'US',
        phone: {
          country_code: '1',
          number: '5551234567',
        },
        shipping_address: {
          address_line_1: '123 Test Street',
          address_line_2: 'Apt 4',
          city: 'New York',
          country: 'US',
          state: 'NY',
          zip_code: '10001',
        },
      },
      payment_method: {
        token: oneTimeToken,
        vaulted_token: null,
      },
    }),
  }).then((resp) => resp.json())

  res.json(response)
})

app.post('/customers/sessions', async (req, res) => {
  const country = req.query.country || 'US'

  const response = await fetch(
    `${API_URL}/v1/customers/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "account_id": ACCOUNT_CODE,
        country,
        "customer_id": CUSTOMER_ID
      })
    }
  ).then((resp) => resp.json())

  res.send(response)
})

app.post('/customers/sessions/:customerSession/payment-methods', async (req, res) => {
  const customerSession = req.params.customerSession
  const paymentMethodType = req.query.paymentMethodType || 'CARD'
  const country = req.query.country || 'US'

  const response = await fetch(
    `${API_URL}/v1/customers/sessions/${customerSession}/payment-methods`,
    {
      method: "POST",
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        "X-idempotency-key": v4(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "payment_method_type": paymentMethodType,
        country,
        "account_id": ACCOUNT_CODE
      }),
    }
  )

  res.send(response)
})

app.get('/payment-methods/:checkoutSession', async (req, res) => {
  const checkoutSession = req.params.checkoutSession
  const response = await fetch(
    `${API_URL}/v1/checkout/sessions/${checkoutSession}/payment-methods`,
    {
      method: 'GET',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }
  )
  const paymentMethods = await response.json()
  res.json(paymentMethods)
})

app.get('/sdk-web/healthy', (req, res) => {
  res.sendStatus(200)
})

app.get('/public-api-key', (req, res) => {
  res.json({ publicApiKey: PUBLIC_API_KEY })
})

app.listen(SERVER_PORT, async () => {
  console.log(`server started at port: ${SERVER_PORT}`)
  app._router.stack.forEach((middleware) => {
    if (middleware.route && middleware.route.methods.get) {
      console.log(`Ruta disponible: http://localhost:${SERVER_PORT}${middleware.route.path}`);
    }
  });

  API_URL = generateBaseUrlApi()

  CUSTOMER_ID = await createCustomer().then(({ id }) => id)
})

const ApiKeyPrefixToEnvironmentSuffix = {
  dev: '-dev',
  staging: '-staging',
  sandbox: '-sandbox',
  prod: '',
}

const baseAPIurl = 'https://api_ENVIRONMENT_.y.uno'

function generateBaseUrlApi() {
  const [apiKeyPrefix] = PUBLIC_API_KEY.split('_')
  let baseURL = ''
  const environmentSuffix = ApiKeyPrefixToEnvironmentSuffix[apiKeyPrefix]
  baseURL = baseAPIurl.replace('_ENVIRONMENT_', environmentSuffix)

  return baseURL
}

function createCustomer() {
  const response = fetch(
    `${API_URL}/v1/customers`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'US', // 客户国家改为US
        merchant_customer_id: Math.floor(Math.random() * 1000000).toString(),
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@y.uno"
      })
    }
  ).then((resp) => resp.json())

  return response
}
