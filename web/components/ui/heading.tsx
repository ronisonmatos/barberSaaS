import type { HTMLAttributes } from "react";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2";
};

const SIZE_CLASSES: Record<NonNullable<HeadingProps["as"]>, string> = {
  h1: "font-display text-2xl",
  h2: "font-display text-xl",
};

export function Heading({ as = "h1", className = "", ...props }: HeadingProps) {
  const Tag = as;
  return <Tag className={`${SIZE_CLASSES[as]} ${className}`.trim()} {...props} />;
}
