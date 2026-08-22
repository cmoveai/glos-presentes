import { MarketingSettings } from "../types";
import { BRAND_CONFIG } from "../config/brand";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Initializes and updates GTM, Google Analytics, Google Ads, Meta Pixel, and SEO meta tags
 */
export function applyMarketingAndTracking(settings: MarketingSettings) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Update Global SEO & Meta tags
  if (settings.seoTitle) {
    document.title = settings.seoTitle;
  } else {
    document.title = `${BRAND_CONFIG.name} | Presentes Criativos & Design Autoral`;
  }

  const updateMetaTag = (name: string, content?: string, isProperty = false) => {
    if (!content) return;
    const attr = isProperty ? `property="${name}"` : `name="${name}"`;
    let meta = document.querySelector(`meta[${attr}]`);
    if (!meta) {
      meta = document.createElement("meta");
      if (isProperty) meta.setAttribute("property", name);
      else meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  if (settings.seoDescription) {
    updateMetaTag("description", settings.seoDescription);
    updateMetaTag("og:description", settings.seoDescription, true);
    updateMetaTag("twitter:description", settings.seoDescription);
  }
  if (settings.seoKeywords) {
    updateMetaTag("keywords", settings.seoKeywords);
  }
  if (settings.seoTitle) {
    updateMetaTag("og:title", settings.seoTitle, true);
    updateMetaTag("twitter:title", settings.seoTitle);
  }
  if (settings.ogImage) {
    updateMetaTag("og:image", settings.ogImage, true);
    updateMetaTag("twitter:image", settings.ogImage);
  }

  // 2. Google Tag Manager (GTM)
  if (settings.gtmEnabled && settings.gtmId && settings.gtmId.startsWith("GTM-")) {
    if (!document.getElementById("gtm-script")) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const gtmScript = document.createElement("script");
      gtmScript.id = "gtm-script";
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${settings.gtmId}`;
      document.head.appendChild(gtmScript);
    }
  }

  // 3. Google Analytics 4 (GA4) / Google Ads (gtag.js)
  const gaId = settings.gaEnabled && settings.gaMeasurementId ? settings.gaMeasurementId : null;
  const gAdsId = settings.googleAdsEnabled && settings.googleAdsId ? settings.googleAdsId : null;
  const primaryGtagTarget = gaId || gAdsId;

  if (primaryGtagTarget) {
    if (!document.getElementById("google-gtag-script")) {
      const gtagScript = document.createElement("script");
      gtagScript.id = "google-gtag-script";
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${primaryGtagTarget}`;
      document.head.appendChild(gtagScript);

      const inlineScript = document.createElement("script");
      inlineScript.id = "google-gtag-inline";
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      `;
      document.head.appendChild(inlineScript);
    }

    if (window.gtag) {
      if (gaId) window.gtag("config", gaId);
      if (gAdsId) window.gtag("config", gAdsId);
    }
  }

  // 4. Meta Pixel (Facebook & Instagram)
  if (settings.metaPixelEnabled && settings.metaPixelId) {
    if (!document.getElementById("meta-pixel-script")) {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.id = "meta-pixel-script";
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
    }

    if (window.fbq) {
      window.fbq("init", settings.metaPixelId);
      window.fbq("track", "PageView");
    }
  }
}

/**
 * Standard E-commerce Tracking Events Dispatcher
 */
export function trackEcommerceEvent(
  eventName: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  data: {
    productId?: string;
    productName?: string;
    category?: string;
    price?: number;
    quantity?: number;
    orderId?: string;
    total?: number;
    currency?: string;
    items?: Array<{ id: string; name: string; price: number; quantity: number }>;
  },
  settings?: MarketingSettings
) {
  if (typeof window === "undefined") return;

  const currency = data.currency || "BRL";

  // Google Analytics & Google Ads Event
  if (window.gtag) {
    if (eventName === "view_item") {
      window.gtag("event", "view_item", {
        currency,
        value: data.price,
        items: [{ item_id: data.productId, item_name: data.productName, item_category: data.category, price: data.price }],
      });
    } else if (eventName === "add_to_cart") {
      window.gtag("event", "add_to_cart", {
        currency,
        value: (data.price || 0) * (data.quantity || 1),
        items: [{ item_id: data.productId, item_name: data.productName, price: data.price, quantity: data.quantity || 1 }],
      });
    } else if (eventName === "begin_checkout") {
      window.gtag("event", "begin_checkout", {
        currency,
        value: data.total,
        items: data.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
      });
    } else if (eventName === "purchase") {
      window.gtag("event", "purchase", {
        transaction_id: data.orderId,
        value: data.total,
        currency,
        items: data.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
      });

      // Google Ads Conversion tracking if label configured
      if (settings?.googleAdsEnabled && settings.googleAdsId && settings.googleAdsConversionLabel) {
        window.gtag("event", "conversion", {
          send_to: `${settings.googleAdsId}/${settings.googleAdsConversionLabel}`,
          value: data.total,
          currency,
          transaction_id: data.orderId,
        });
      }
    }
  }

  // Meta Pixel (fbq)
  if (window.fbq) {
    if (eventName === "view_item") {
      window.fbq("track", "ViewContent", {
        content_name: data.productName,
        content_ids: [data.productId],
        content_type: "product",
        value: data.price,
        currency,
      });
    } else if (eventName === "add_to_cart") {
      window.fbq("track", "AddToCart", {
        content_name: data.productName,
        content_ids: [data.productId],
        content_type: "product",
        value: (data.price || 0) * (data.quantity || 1),
        currency,
      });
    } else if (eventName === "begin_checkout") {
      window.fbq("track", "InitiateCheckout", {
        value: data.total,
        currency,
        num_items: data.items?.length,
      });
    } else if (eventName === "purchase") {
      window.fbq("track", "Purchase", {
        value: data.total,
        currency,
        content_type: "product",
        order_id: data.orderId,
      });
    }
  }
}
