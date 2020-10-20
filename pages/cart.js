import baseUrl from "../helpers/baseUrl";
import { parseCookies } from "nookies";
import cookie from "js-cookie";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";

import StripeCheckout from "react-stripe-checkout";
import midTransClient from "midtrans-client";
// import ReactMidtrans from "react-midtrans";
// let coreApi = new midTransClient.CoreApi({
//   isProduction: false,
//   serverKey: process.env.MIDTRANS_SERVER_KEY,
//   clientKey: process.env.MIDTRANS_CLIENT_KEY,
// });
let midtrans = new midTransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const Cart = ({ error, products }) => {
  const { token } = parseCookies();
  const router = useRouter();
  const [cProducts, setCartProduct] = useState(products);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  let price = 0;

  if (!token) {
    return (
      <div className="center-align">
        <h3>please login to view your cart</h3>
        <Link href="/login">
          <a>
            <button className="btn #1565c0 blue darken-3">Login</button>
          </a>
        </Link>
      </div>
    );
  }
  if (error) {
    M.toast({ html: error, classes: "red" });
    cookie.remove("user");
    cookie.remove("token");
    router.push("/login");
  }
  const handleRemove = async (pid) => {
    const res = await fetch(`${baseUrl}/api/cart`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        productId: pid,
      }),
    });

    const res2 = await res.json();
    setCartProduct(res2);
  };
  const CartItems = () => {
    return (
      <>
        {cProducts.map((item) => {
          price = price + item.quantity * item.product.price;
          return (
            <div style={{ display: "flex", margin: "20px" }} key={item._id}>
              <img src={item.product.mediaUrl} style={{ width: "30%" }} />
              <div style={{ marginLeft: "20px" }}>
                <h6>{item.product.name}</h6>
                <h6>
                  {item.quantity} x Rp. {item.product.price}
                </h6>
                <button
                  className="btn red"
                  onClick={() => {
                    handleRemove(item.product._id);
                  }}
                >
                  remove
                </button>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const handleCheckout = async (paymentInfo) => {
    console.log("handleCheckout: ", JSON.stringify({ paymentInfo }));
    const res = await fetch(`${baseUrl}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ paymentInfo }),
    });
    const res2 = await res.json();
    M.toast({ html: res2.mesage, classes: "green " });
    router.push("/");
  };

  const handleCheckout2 = async () => {
    console.log("auth: ", btoa(process.env.MIDTRANS_SERVER_KEY + ":"));
    const res = await fetch(`${baseUrl}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization: "Basic " + btoa(process.env.MIDTRANS_SERVER_KEY + ":"),
        Authorization: token,
      },
      // body: paymentInfo,
    });
    const res2 = await res.json();
    console.log("res2: ", res2);
    window.snap.pay(res2.snapToken);
    // M.toast({ html: res2.mesage, classes: "green " });
    router.push("/");
  };
  const CheckOutModal = () => {
    return (
      <div>
        <h1>CHECKOUT MODAL</h1>
        <button>Submit</button>
        <button
          onClick={() => {
            setCheckOutModalVisible(false);
          }}
        >
          Close
        </button>
      </div>
    );
  };

  const TotalPrice = () => {
    console.log("length: ", products.length);
    return (
      <div
        className="container"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <h5>Total Rp. {price}</h5>
        {products.length != 0 && (
          <button
            onClick={() => {
              let token = handleCheckout2();
              console.log("token from payment:", token);
            }}
            // onClick={() => {
            //   setCheckOutModalVisible(true);
            // }}
          >
            Checkout
          </button>
        )}
        {/* {checkOutModalVisible && <CheckOutModal />} */}
        {/* {products.length != 0 && ( */}
        {/*   <StripeCheckout */}
        {/*     name="My store" */}
        {/*     amount={price * 100} */}
        {/*     image={products.length > 0 ? products[0].product.mediaUrl : ""} */}
        {/*     currency="INR" */}
        {/*     shippingAddress={true} */}
        {/*     billingAddress={true} */}
        {/*     zipCode={true} */}
        {/*     stripeKey="pk_test_51H6fgDEta3rHzkPYGgIOQZSFrukEzAl71AOnyAUjyGR8uJPDaGfALQYWre4F5g0Quyh9d7PTphh56SmUlhtsQYmd00DZwB9gMj" */}
        {/*     token={(paymentInfo) => handleCheckout(paymentInfo)} */}
        {/*   > */}
        {/*     <button className="btn">Checkout</button> */}
        {/*   </StripeCheckout> */}
        {/* )} */}
      </div>
    );
  };
  return (
    <div className="container">
      <CartItems />
      <TotalPrice />
    </div>
  );
};

export async function getServerSideProps(ctx) {
  const { token } = parseCookies(ctx);
  if (!token) {
    return {
      props: { products: [] },
    };
  }
  const res = await fetch(`${baseUrl}/api/cart`, {
    headers: {
      Authorization: token,
    },
  });
  const products = await res.json();
  if (products.error) {
    return {
      props: { error: products.error },
    };
  }
  console.log("products", products);
  return {
    props: { products },
  };
}

export default Cart;

