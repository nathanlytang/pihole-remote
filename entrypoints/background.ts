export default defineBackground(() => {
  console.log('Pi-hole Remote background script loaded', { id: browser.runtime.id });
});
