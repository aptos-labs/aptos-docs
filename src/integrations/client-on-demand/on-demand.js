/**
 * Modern timing utility using requestAnimationFrame double-RAF pattern
 * Ensures execution after the next browser paint cycle
 */
const waitForRender = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

/**
 * Reusable on-demand hydration directive
 * Supports configurable event names for maximum flexibility
 * @type {import('astro').ClientDirective}
 */
const onDemandDirective = (load, opts, el) => {
  let hasHydrated = false;

  // Get event name(s) from directive value, data attribute, or default
  let eventName = "activate";

  if (typeof opts === "string") {
    eventName = opts;
  } else if (opts && typeof opts === "object" && opts.value) {
    eventName = opts.value;
  } else if (el.dataset.triggerEvent) {
    eventName = el.dataset.triggerEvent;
  }

  const events = eventName.split(",").map((e) => e.trim());

  const handleTrigger = async () => {
    if (!hasHydrated) {
      hasHydrated = true;

      try {
        const hydrate = await load();
        await hydrate();

        // Wait for React to complete its render cycle using modern browser APIs
        await waitForRender();

        // After hydration and render completion, trigger the primary event
        window.dispatchEvent(new CustomEvent(events[0]));
      } catch (error) {
        console.error(`client:on-demand - Failed to hydrate component:`, error);
        hasHydrated = false;
      }
    }
  };

  // Listen to all specified events
  events.forEach((event) => {
    window.addEventListener(event, handleTrigger);
  });

  // Cleanup function
  return () => {
    events.forEach((event) => {
      window.removeEventListener(event, handleTrigger);
    });
  };
};

export default onDemandDirective;
