export class Truncated extends HTMLElement {
  isManualToggle = false;
  breadcrumbs: HTMLElement | null = null;
  mainClass: string | null = null;
  totalWidth = 0;
  resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();

    this.mainClass = this.dataset.mainClass ?? null;
    const id = this.dataset.id;

    if (!("truncated" in this.dataset) || !id) return;

    // Select the breadcrumbs element
    this.breadcrumbs = document.getElementById(id);

    this.initializeCrumbs();
    this.setupResizeObserver();
  }

  /**
   * Initialize the crumbs and calculate the total width of the breadcrumbs
   */
  initializeCrumbs(): void {
    const crumbs = this.breadcrumbs?.querySelectorAll(".breadcrumb-item");
    crumbs?.forEach((crumb) => {
      this.totalWidth += (crumb as HTMLElement).offsetWidth;
    });
  }

  /**
   * Setup the ResizeObserver to check for overflow on the breadcrumbs
   */
  setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.checkOverflow(entry.target.clientWidth);
      });
    });

    if (this.breadcrumbs) this.resizeObserver.observe(this.breadcrumbs);
  }

  connectedCallback() {
    this.setupTruncatedButton();
  }

  disconnectedCallback() {
    if (this.resizeObserver && this.breadcrumbs) {
      this.resizeObserver.unobserve(this.breadcrumbs);
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Toggle the visibility of the truncated crumb
   */
  toggleTruncated(isTruncated: boolean) {
    this.breadcrumbs?.classList.toggle("is-truncated", isTruncated);
  }

  /**
   * Setup the truncated button click handler
   */
  setupTruncatedButton() {
    const truncatedButton = this.breadcrumbs?.querySelector(".ellipsis-button");
    truncatedButton?.addEventListener("click", this.handleTruncatedButtonClick.bind(this));
  }

  /**
   * Handle the click event on the truncated button
   */
  handleTruncatedButtonClick = (): void => {
    this.breadcrumbs?.classList.remove("is-truncated");
    this.isManualToggle = true;
  };

  /**
   * Check if the breadcrumbs are overflowing
   */
  checkOverflow(clientWidth: number): void {
    const isOverflowing = this.totalWidth > clientWidth && !this.isManualToggle;
    this.toggleTruncated(isOverflowing);
    if (!isOverflowing) this.isManualToggle = false;
  }
}
