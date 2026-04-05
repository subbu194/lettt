import { getRazorpayInstance as getInstanceFromConfig, getRazorpayKeyId as getKeyId } from "../config/razorpay";

export function getRazorpayInstance() {
  return getInstanceFromConfig();
}

export function getRazorpayKeyId() {
  return getKeyId();
}
