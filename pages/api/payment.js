import Stripe from "stripe";
import { v4 as uuidV4 } from "uuid";
import Cart from "../../models/Cart";
import jwt from "jsonwebtoken";
import Order from "../../models/Order";
import initDb from "../../helpers/initDB";
import midTransClient from "midtrans-client";

initDb();

const stripe = Stripe(process.env.STRIPE_SECRET);
let coreApi = new midTransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
const midtrans = new midTransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
console.log("midtransClient: ", midtrans);
export default async (req, res) => {
  const { paymentInfo } = req.body;
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "you must logged in" });
  }

  try {
    const { userId } = jwt.verify(authorization, process.env.JWT_SECRET);
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );
    let price = 0;
    cart.products.forEach((item) => {
      price = price + item.quantity * item.product.price;
    });
    // const prevCustomer = await stripe.customers.list({
    //   email: paymentInfo.email,
    // });
    // const isExistingCustomer = prevCustomer.data.length > 0;
    // let newCustomer;
    // if (!isExistingCustomer) {
    //   newCustomer = await stripe.customers.create({
    //     email: paymentInfo.email,
    //     source: paymentInfo.id,
    //   });
    // }

    let parameter = {
      transaction_details: {
        order_id: uuidV4(),
        gross_amount: price,
      },
      credit_card: {
        secure: true,
      },
    };

    console.log("midtrans payment: ");
    midtrans.createTransaction(parameter).then((transaction) => {
      // transaction token
      let transactionToken = transaction.token;
      console.log("transactionToken:", transactionToken);
      res.status(200).json({
        message: "payment was successful",
        snapToken: transactionToken,
      });
    });

    // await stripe.charges.create(
    //   {
    //     currency: "INR",
    //     amount: price * 100,
    //     receipt_email: paymentInfo.email,
    //     customer: isExistingCustomer ? prevCustomer.data[0].id : newCustomer.id,
    //     description: `you purchased a product | ${paymentInfo.email}`,
    //   },
    //   {
    //     idempotencyKey: uuidV4(),
    //   }
    // );
    // await new Order({
    //   user: userId,
    //   email: paymentInfo.email,
    //   total: price,
    //   products: cart.products,
    // }).save();
    // await Cart.findOneAndUpdate({ _id: cart._id }, { $set: { products: [] } });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: "error processing payment" });
  }
};

