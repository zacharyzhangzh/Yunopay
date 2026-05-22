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
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }))
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

// 1. 标准本地会话接口
app.post('/checkout/sessions', async (req, res) => {
  const country = 'IN' // 强制指定印度
  
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
        merchant_order_id: 'ORDER_' + Date.now(),
        payment_description: 'Test Standard Payment ' + Date.now(),
        country,
        customer_id: CUSTOMER_ID,
        amount: {
          currency: 'INR',   // 调整为印度本币
          value: 11529,      // 调整为真实的测试大额
        },
      }),
    }
  ).then((resp) => resp.json())

  res.send(response)
})

// 2. 无缝流 SDK_SEAMLESS 会话接口（核心修改点）
app.post('/checkout/seamless/sessions', async (req, res) => {
  const country = 'IN' // 强制指定印度

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
        merchant_order_id: 'ORDER_' + Date.now(),
        payment_description: 'Test Seamless Payment ' + Date.now(),
        country,
        customer_id: CUSTOMER_ID,
        amount: {
          currency: 'INR',   // 调整为印度本币
          value: 11529,      // 调整为符合航旅机票的测试大额
        },
        workflow: 'SDK_SEAMLESS',
        
        additional_data: {
          order: {
            // ⭐ 【关键修复】：注入发票号（Booking ID格式），全自动映射至 PayU 的 udf5 字段
            invoice: {
              number: '1110114351563538437'
            },
            shipping_amount: 0,
            fee_amount: 0,
            tip_amount: '0',
            taxes: [
              {
                type: 'VAT',
                tax_base: 11529, // 金额同步
                value: 0,
                percentage: 0
              }
            ],
            items: [
              {
                category: 'travel',
                id: 'FLIGHT_HEG_01',
                name: 'Flight Ticket Delhi to Mumbai',
                quantity: 1,
                unit_amount: 11529, // 金额同步
                brand: 'HappyEasyGo',
                sku_code: 'HEG998123',
                manufacture_part_number: 'MPN998811'
              }
            ]
          }
        },
        // 下方三要素（客户姓名、印度手机号、全套印度合规账单地址）已全部精确适配
        customer_payer: {
          merchant_customer_id: '1',
          first_name: 'MARK',
          last_name: 'TEST',
          date_of_birth: '1985-12-20',
          email: 'mark.shen@happyeasygo.com',
          nationality: 'IN', 
          ip_address: '192.168.31.113',
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
            document_number: 'Pas123',
            document_type: 'PAS'
          },
          billing_address: {
            address_line_1: '123 Example Street',
            address_line_2: 'Unit 07-01',
            city: 'Delhi',
            country: 'IN', 
            state: 'Delhi',
            zip_code: '110001',
            neighborhood: 'Central Delhi'
          },
          shipping_address: {
            address_line_1: '9 Temasek Boulevard, Suntec Tower 2',
            address_line_2: 'Unit 07-01',
            city: 'Singapore',
            state: 'Singapore',
            zip_code: '038989',
            neighborhood: 'Downtown',
            country: 'SG' 
          },
          phone: {
            country_code: '91', // 强固定印度区号
            number: '87654321'
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

// 3. 常规直连创建支付接口
app.post('/payments', async (req, res) => {
  const checkoutSession = req.body.checkoutSession
  const oneTimeToken = req.body.oneTimeToken
  const country = 'IN'
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
      merchant_order_id: 'ORDER_' + Date.now(), 
      country,
      additional_data: {
        order: {
          // 常规扣款也加上 invoice 保证测试一致性
          invoice: {
            number: '1110114351563538437'
          },
          fee_amount: 0,
          items: [
            {
              brand: 'HappyEasyGo',
              category: 'Travel',
              id: '123AD',
              manufacture_part_number: 'XYZ123456',
              name: 'Flight Ticket',
              quantity: 1,
              sku_code: '8765432109',
              unit_amount: 11529, 
            },
          ],
          shipping_amount: 0,
        },
      },
      amount: {
        currency: 'INR',
        value: 11529, 
      },
      checkout: {
        session: checkoutSession,
      },
      customer_payer: {
        billing_address: {
          address_line_1: '123 Example Street',
          address_line_2: 'Unit 07-01',
          city: 'Delhi',
          country: 'IN',
          state: 'Delhi',
          zip_code: '110001',
        },
        date_of_birth: '1985-12-20',
        device_fingerprint: 'hi88287gbd8d7d782ge....',
        document: {
          document_type: documentType,
          document_number: documentNumber,
        },
        email: 'mark.shen@happyeasygo.com',
        first_name: 'MARK',
        gender: 'MALE',
        id: CUSTOMER_ID,
        ip_address: '192.168.31.113',
        last_name: 'TEST',
        merchant_customer_id: '1',
        nationality: 'IN',
        phone: {
          country_code: '91',
          number: '87654321',
        },
        shipping_address: {
          address_line_1: '123 Example Street',
          address_line_2: 'Unit 07-01',
          city: 'Delhi',
          country: 'IN',
          state: 'Delhi',
          zip_code: '110001',
        },
      },
      payment_method: {
        token: oneTimeToken,
        vaulted_token: null,
      },
    }),
  }).then((resp) => resp.json())

  console.log("== Payment Execution Response ==");
  console.log(JSON.stringify(response, null, 2));

  res.json(response)
})

app.post('/customers/sessions', async (req, res) => {
  const country = 'IN'

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
  const country = 'IN'

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
        country: 'IN', // 客户国家适配印度
        merchant_customer_id: Math.floor(Math.random() * 1000000).toString(),
        first_name: "MARK",
        last_name: "TEST",
        email: "mark.shen@happyeasygo.com"
      })
    }
  ).then((resp) => resp.json())

  return response
}
