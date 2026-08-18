import type { KnowledgeBaseSource } from "./types";

export interface KnowledgeBaseGroup {
  id: string;
  name: string;
  icon: "shopping" | "checkout" | "shipping" | "returns" | "gifts" | "support";
  sources: KnowledgeBaseSource[];
  /** Ordered references to article modules discovered under articles/. */
  articleIds: string[];
}

/**
 * Customer-facing information architecture.
 *
 * This catalogue owns category metadata and article order only. Article titles,
 * bodies, tags, layouts, and media tokens live in dedicated article modules.
 */
export const knowledgeBaseGroups = [
  {
    id: "shopping-products",
    name: "Shopping and product selection",
    icon: "shopping",
    sources: [
      {
        label: "Products",
        url: "https://peanuts.store/collections/all",
      },
      {
        label: "Sizing charts",
        url: "https://peanuts.store/pages/sizing-charts",
      },
      {
        label: "Shop by character",
        url: "https://peanuts.store/pages/shop-by-character",
      },
    ],
    articleIds: [
      "shopping-browse-by-character",
      "shopping-shop-by-collection",
      "shopping-gifts-by-price",
      "shopping-filter-products",
      "shopping-sort-products",
      "shopping-quick-to-ship",
      "shopping-apparel-size",
      "shopping-measure-shirt",
      "shopping-out-of-stock",
      "shopping-preorders-availability",
      "shopping-phone-case-model",
      "shopping-product-care",
      "shopping-wishlist",
    ],
  },
  {
    id: "ordering-checkout",
    name: "Ordering and checkout",
    icon: "checkout",
    sources: [
      {
        label: "Ordering policy",
        url: "https://peanuts.store/pages/ordering-policy",
      },
      {
        label: "Promotion terms",
        url: "https://peanuts.store/pages/promotional-disclaimers",
      },
      {
        label: "Coupon help",
        url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263559968148-Coupon-Codes-and-Discounts",
      },
    ],
    articleIds: [
      "ordering-place-order",
      "ordering-product-variant",
      "ordering-personalised",
      "ordering-delivery-estimates",
      "ordering-apply-coupon",
      "ordering-newsletter-discount",
      "ordering-missing-newsletter-coupon",
      "ordering-discount-not-applying",
      "ordering-statuses",
      "ordering-cancel-change",
      "ordering-billing-verification",
      "ordering-taxes-duties",
    ],
  },
  {
    id: "shipping-tracking",
    name: "Shipping and tracking",
    icon: "shipping",
    sources: [
      {
        label: "Shipping policy",
        url: "https://peanuts.store/pages/shipping-policy",
      },
      {
        label: "Shipping and tracking help",
        url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263579199892-Shipping-Order-Tracking-and-Delivery-information",
      },
    ],
    articleIds: [
      "shipping-arrival-date",
      "shipping-track-order",
      "shipping-tracking-not-updated",
      "shipping-delivered-not-received",
      "shipping-split-shipment",
      "shipping-canada",
      "shipping-duties",
      "shipping-apo-fpo",
      "shipping-po-box",
      "shipping-multiple-addresses",
      "shipping-returned-to-sender",
    ],
  },
  {
    id: "returns-refunds",
    name: "Returns, refunds, and damaged products",
    icon: "returns",
    sources: [
      {
        label: "Return policy",
        url: "https://peanuts.store/pages/return-policy",
      },
      {
        label: "Returns and exchanges help",
        url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263552225812-Returns-and-Exchanges",
      },
    ],
    articleIds: [
      "returns-start-return",
      "returns-nonreturnable-products",
      "returns-prepaid-label",
      "returns-label-without-printer",
      "returns-shipping-deductions",
      "returns-refund-timing",
      "returns-paypal-refund",
      "returns-damaged-product",
      "returns-wrong-item",
      "returns-incorrect-size",
      "returns-gift-order",
      "returns-holiday-window",
    ],
  },
  {
    id: "gifts-bulk",
    name: "Gifts and bulk purchasing",
    icon: "gifts",
    sources: [
      {
        label: "eGift cards",
        url: "https://peanuts.store/products/peanuts-store-egift-card",
      },
      {
        label: "Gift help",
        url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263556808084-Gift-Wrapping-and-Messaging",
      },
      {
        label: "Volume discounts",
        url: "https://peanuts.store/pages/volume-discounts",
      },
    ],
    articleIds: [
      "gifts-egift-card",
      "gifts-send-to-recipient",
      "gifts-message",
      "gifts-pricing-in-package",
      "gifts-wrapping",
      "gifts-volume-discount",
      "gifts-bulk-event",
    ],
  },
  {
    id: "accounts-support",
    name: "Accounts and customer support",
    icon: "support",
    sources: [
      {
        label: "Store account",
        url: "https://peanuts.store/account/login",
      },
      {
        label: "Support Centre",
        url: "https://help.peanutsstoresupport.com/hc/en-us",
      },
      {
        label: "Privacy policy",
        url: "https://peanuts.store/pages/privacy-policy",
      },
    ],
    articleIds: [
      "accounts-create-account",
      "accounts-sign-in-reset-password",
      "accounts-order-status",
      "accounts-contact-order-support",
      "accounts-submit-support-request",
      "guides-contact-customer-support",
      "guides-contact-customer-support-slideshow",
      "accounts-unsubscribe",
      "accounts-privacy-policy",
    ],
  },
] satisfies KnowledgeBaseGroup[];
