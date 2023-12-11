import React from "react";
type UseHoverType<T extends HTMLElement> = [React.RefObject<T>, boolean];
export function useHover<T extends HTMLElement>(): UseHoverType<T> {
  const [value, setValue] = React.useState(false);

  const ref = React.useRef<T>(null);

  const handleMouseOver = () => setValue(true);
  const handleMouseOut = () => setValue(false);

  React.useEffect(
    () => {
      const node = ref.current;
      if (node) {
        node.addEventListener("mouseover", handleMouseOver);
        node.addEventListener("mouseout", handleMouseOut);
      }
      return () => {
        if (!node) {
          return;
        }
        node.removeEventListener("mouseover", handleMouseOver);
        node.removeEventListener("mouseout", handleMouseOut);
      };
    },
    [], // Recall only if ref changes
  );

  return [ref, value];
}
