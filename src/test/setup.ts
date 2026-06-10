if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    // @ts-ignore minimal shim
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }
  // @ts-ignore minimal shim
  window.IntersectionObserver ||= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // @ts-ignore minimal shim
  window.ResizeObserver ||= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
