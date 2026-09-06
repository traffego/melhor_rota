"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { PixelSetting } from "@/types";

declare global {
  interface Window {
    fbq?: any;
    dataLayer?: any[];
    ttq?: any;
    gtag?: any;
    trackCustomPixelEvent?: (eventName: string, data: Record<string, any>) => void;
  }
}

export function PixelTracker() {
  const [pixels, setPixels] = useState<PixelSetting[]>([]);

  useEffect(() => {
    // Carregar pixels ativos do backend
    async function loadPixels() {
      try {
        const res = await fetch("/api/pixels");
        if (res.ok) {
          const data = await res.json();
          setPixels(data.pixels || []);
        }
      } catch (err) {
        console.warn("Não foi possível carregar configurações de pixels:", err);
      }
    }
    loadPixels();

    // Registrar dispatcher global
    window.trackCustomPixelEvent = (eventName: string, data: Record<string, any>) => {
      // 1. Meta Pixel
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", eventName, data);
      }

      // 2. Google Tag Manager / DataLayer
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: eventName,
          ...data,
        });
      }

      // 3. TikTok Pixel
      if (window.ttq && typeof window.ttq.track === "function") {
        window.ttq.track(eventName, data);
      }

      // 4. Google Ads
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, data);
      }

      console.log(`[Pixel Tracker] Evento disparado: ${eventName}`, data);
    };
  }, []);

  const metaPixel = pixels.find((p) => p.platform === "meta" && p.is_active && p.pixel_id);
  const gtmPixel = pixels.find((p) => p.platform === "gtm" && p.is_active && p.pixel_id);
  const tiktokPixel = pixels.find((p) => p.platform === "tiktok" && p.is_active && p.pixel_id);
  const gadsPixel = pixels.find((p) => p.platform === "gads" && p.is_active && p.pixel_id);

  return (
    <>
      {/* Meta Pixel */}
      {metaPixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixel.pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Google Tag Manager (GTM) */}
      {gtmPixel && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmPixel.pixel_id}');
          `}
        </Script>
      )}

      {/* TikTok Pixel */}
      {tiktokPixel && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
              ttq.load('${tiktokPixel.pixel_id}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Google Ads Conversion Tag */}
      {gadsPixel && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gadsPixel.pixel_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-ads-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gadsPixel.pixel_id}');
            `}
          </Script>
        </>
      )}
    </>
  );
}

// Utilitário para disparar eventos em componentes
export function triggerPixelEvent(eventName: string, data: Record<string, any>) {
  if (typeof window !== "undefined" && window.trackCustomPixelEvent) {
    window.trackCustomPixelEvent(eventName, data);
  }
}
