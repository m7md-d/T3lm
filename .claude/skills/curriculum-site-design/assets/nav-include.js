/* shared sidebar partial — inject via document include or just paste */
window.AWDL_NAV = `
<aside class="sidebar">
  <div class="sb-title">// مرجع البروتوكول</div>
  <a href="../index.html" data-mod="home"><span class="num">·</span><span>الصفحة الرئيسية</span></a>

  <div class="sb-title">// الوحدات</div>
  <a href="module-0.html" data-mod="0"><span class="num">00</span><span>الأساسيات: 802.11 و MAC</span></a>
  <a href="module-1.html" data-mod="1"><span class="num">01</span><span>تشريح بروتوكول AWDL</span></a>
  <a href="module-2.html" data-mod="2"><span class="num">02</span><span>تشريح AirDrop الكامل</span></a>
  <a href="module-3.html" data-mod="3"><span class="num">03</span><span>متطلبات العتاد</span></a>
  <a href="module-4.html" data-mod="4"><span class="num">04</span><span>مشروع OWL و OpenDrop</span></a>
  <a href="module-5.html" data-mod="5"><span class="num">05</span><span>المعامل العملية</span></a>
  <a href="module-6.html" data-mod="6"><span class="num">06</span><span>الأمن والهجمات</span></a>
  <a href="module-7.html" data-mod="7"><span class="num">07</span><span>البدائل والمستقبل</span></a>

  <div class="sb-title">// المراجع</div>
  <a href="../appendices.html" data-mod="appx"><span class="num">A</span><span>المسرد والأوامر</span></a>

  <div class="sb-title">// CHEAT</div>
  <div style="font-family: var(--mono); font-size: 11px; color: var(--fg-dim); padding: 0 10px; line-height: 1.8;">
    BSSID: <span style="color: var(--acid);">00:25:00:FF:94:73</span><br>
    OUI:   <span style="color: var(--acid);">00:17:F2</span><br>
    SIFS:  <span style="color: var(--amber);">16 µs</span><br>
    AW:    <span style="color: var(--amber);">16 TU</span><br>
    TU:    <span style="color: var(--amber);">1024 µs</span>
  </div>
</aside>`;

document.addEventListener('DOMContentLoaded', () => {
  const slot = document.getElementById('nav-slot');
  if (slot) {
    slot.outerHTML = window.AWDL_NAV;
    const me = document.body.dataset.mod;
    if (me) {
      document.querySelectorAll('.sidebar a').forEach(a => {
        if (a.dataset.mod === me) a.classList.add('active');
      });
    }
  }
});
