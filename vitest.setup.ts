import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { alt, fill, priority, ...rest } = props as React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
    };
    return React.createElement("img", { alt: alt ?? "", ...rest });
  },
}));

