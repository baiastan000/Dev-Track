import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function getPageBlocks(container) {
  const topLevel = Array.from(container.children);
  if (topLevel.length !== 1) return topLevel;

  let pageRoot = topLevel[0];
  if (
    pageRoot.tagName === "DIV" &&
    pageRoot.children.length === 1 &&
    pageRoot.firstElementChild.tagName === "DIV"
  ) {
    pageRoot = pageRoot.firstElementChild;
  }

  const blocks = Array.from(pageRoot.children);
  return blocks.length ? blocks : [pageRoot];
}

function getCascadeTargets(blocks) {
  return blocks.flatMap((block) => {
    if (getComputedStyle(block).display === "grid" && block.children.length > 1) {
      return Array.from(block.children);
    }
    return [block];
  });
}

export default function AnimatedPage({ children }) {
  const containerRef = useRef(null);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const targets = getCascadeTargets(getPageBlocks(container));
    targets.forEach((element, index) => {
      element.dataset.cascadeItem = "";
      element.style.setProperty("--cascade-index", String(Math.min(index, 12)));
    });

    return () => {
      targets.forEach((element) => {
        delete element.dataset.cascadeItem;
        element.style.removeProperty("--cascade-index");
      });
    };
  }, [pathname]);

  return (
    <div key={pathname} ref={containerRef} className="animated-page">
      {children}
    </div>
  );
}
