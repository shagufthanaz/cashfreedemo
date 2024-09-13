import fetch from 'node-fetch'; // Use import instead of require
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cashfree Payment Integration</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 0;
                color: #333;
            }

            .container {
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            h2 {
                text-align: center;
                color: #4a4a4a;
            }

            form {
                display: flex;
                flex-direction: column;
            }

            label {
                margin-bottom: 5px;
                font-weight: bold;
                color: #555;
            }

            input {
                padding: 10px;
                margin-bottom: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 16px;
                outline: none;
                transition: border-color 0.3s ease;
            }

            input:focus {
                border-color: #800080;
            }

            button {
                padding: 12px;
                background-color: #800080;
                color: white;
                font-size: 16px;
                font-weight: bold;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }

            button:hover {
                background-color: #6a006a;
            }

            p {
                font-size: 14px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Order Form</h2>
            <form action="/create-order" method="post">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>

                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>

                <label for="phone">Phone:</label>
                <input type="tel" id="phone" name="phone" required>

                <label for="amount">Amount:</label>
                <input type="number" id="amount" name="amount" required>

                <button type="submit">Create order</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

app.get('/result', async (req, res) => {
  const { order_id } = req.query;

  const headers = {
    'x-client-id': '13764729ed596674a0f96e06f3746731',
    'x-client-secret': '1f4ee1fd095fcd3cfa702f0c91389c8adca03b5a',
    'Accept': 'application/json',
    'x-api-version': '2023-08-01'
  };

  try {
    const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${order_id}/payments`, {
      method: 'GET',
      headers: headers
    });

    const paymentData = await response.json();
    console.log('Payment result:', paymentData);

    if (paymentData.length > 0) {
      const payment = paymentData[0]; // Since this is an array, we access the first payment object.

      const paymentStatus = payment.payment_status;
      const paymentAmount = payment.payment_amount;
      const orderAmount = payment.order_amount;
      const paymentTime = new Date(payment.payment_time);
      const upiId = payment.payment_method?.upi?.upi_id || 'N/A';
      const bankReference = payment.bank_reference || 'N/A';
      const paymentMessage = payment.payment_message || 'N/A';

      // Render the payment result
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Result</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }

                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                h2 {
                    text-align: center;
                    color: #4a4a4a;
                }

                p {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555;
                }

                strong {
                    font-weight: bold;
                    color: #333;
                }

                .payment-details {
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Payment Result</h2>
                <div class="payment-details">
                    <p><strong>Order ID:</strong> ${order_id}</p>
                    <p><strong>Payment Status:</strong> ${paymentStatus}</p>
                    <p><strong>Payment Amount:</strong> ₹${paymentAmount}</p>
                    <p><strong>Order Amount:</strong> ₹${orderAmount}</p>
                    <p><strong>Payment Time:</strong> ${paymentTime.toLocaleString()}</p>
                    <p><strong>UPI ID:</strong> ${upiId}</p>
                    <p><strong>Bank Reference:</strong> ${bankReference}</p>
                    <p><strong>Payment Message:</strong> ${paymentMessage}</p>
                </div>
                <p><a href="/">Back to home</a></p>
            </div>
        </body>
        </html>
      `);
    } else {
      res.send(`<p>No payment records found for Order ID: ${order_id}</p>`);
    }
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).send('Error fetching payment status.');
  }
});

// Create order on form submission
app.post('/create-order', async (req, res) => {
  const { name, email, phone, amount } = req.body;
  console.log('Form data:', req.body);
  const order_id = "order_" + new Date().getTime();

  const orderData = {
    order_amount: amount,
    order_currency: "INR",
    order_id: order_id,
    customer_details: {
      customer_id: `cust_${new Date().getTime()}`,
      customer_phone: phone,
      customer_name: name,
      customer_email: email
    },
    order_meta: {
      return_url: `http://localhost:3000/result?order_id=${order_id}`
      
    }
  };

  const headers = {
    'x-client-id': '13764729ed596674a0f96e06f3746731',
    'x-client-secret': '1f4ee1fd095fcd3cfa702f0c91389c8adca03b5a',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01'
  };

  try {
    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('Create order response:', result)
    
    if (result.payment_session_id) {

      let customer = result.customer_details;
      let session_id = result.payment_session_id;
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cashfree Checkout Integration</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }

                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    text-align: center;
                    color: #4a4a4a;
                }

                p {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555;
                }

                #payNowBtn {
                    display: block;
                    width: 100%;
                    padding: 12px;
                    background-color: #800080;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    text-align: center;
                }

                #payNowBtn:hover {
                    background-color: #6a006a;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Order Details</h1>
                <div class="customer-details">
                    <p><strong>Customer ID:</strong> ${customer.customer_id}</p>
                    <p><strong>Customer Name:</strong> ${customer.customer_name}</p>
                    <p><strong>Customer Email:</strong> ${customer.customer_email}</p>
                    <p><strong>Order Amount:</strong> ₹${result.order_amount}</p>
                    <p><strong>Order Currency:</strong> ${result.order_currency}</p>
                    <p><strong>Order ID:</strong> ${result.order_id}</p>
                </div>
                <button id="payNowBtn">Pay ₹${result.order_amount}</button>
            </div>

            <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
            <script>
                const cashfree = Cashfree({
                    mode: "sandbox",
                });

                document.getElementById("payNowBtn").addEventListener("click", () => {
                    let checkoutOptions = {
                        paymentSessionId: "${session_id}",
                        redirectTarget: "_self",
                    };
                    cashfree.checkout(checkoutOptions);
                });
            </script>
        </body>
        </html>
      `);
    } else {
      res.status(400).send('Failed to create order. Please try again.');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
