"use client";

/**
 * Яндекс.Метрика: счётчик + вебвизор (настройки из кабинета Метрики).
 * ID счётчика — NEXT_PUBLIC_YM_ID (сборка Next вшивает в бандл).
 */
import Script from "next/script";

const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

export function YandexMetrika() {
  if (!YM_ID) return null;
  const id = Number(YM_ID);
  if (!Number.isFinite(id) || id <= 0) return null;

  const tagSrc = `https://mc.yandex.ru/metrika/tag.js?id=${id}`;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script',${JSON.stringify(tagSrc)}, 'ym');

ym(${id}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
