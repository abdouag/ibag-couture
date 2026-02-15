"use client";

import { useEffect } from "react";

export default function ScrollRevealProvider() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sr-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".sr-hidden");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Re-observe on route changes (SPA navigation)
  useEffect(() => {
    const handleMutation = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("sr-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      const elements = document.querySelectorAll(".sr-hidden:not(.sr-visible)");
      elements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => mutationObserver.disconnect();
  }, []);

  return null;
}
