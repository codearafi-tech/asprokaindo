"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  MeshGradient as PaperMeshGradient,
} from "@paper-design/shaders-react";

export interface MeshGradientProps {
  colors?: string[];

  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;

  speed?: number;
  distortion?: number;
  swirl?: number;

  scale?: number;
  rotation?: number;

  className?: string;
  style?: React.CSSProperties;
}

export const MeshGradient = React.memo(function MeshGradient({
  colors: colorsProp,

  color1 = "#4c9bff",
  color2 = "#1f4fd8",
  color3 = "#0a1a4a",
  color4,

  speed = 1,
  distortion = 1,
  swirl = 0.57,

  scale = 1.45,
  rotation = 120,

  className,
  style,
}: MeshGradientProps) {
  const colors = React.useMemo(() => {
    if (colorsProp && colorsProp.length > 0) {
      return colorsProp;
    }

    const list = [color1, color2, color3];

    if (color4) {
      list.push(color4);
    }

    return list;
  }, [
    colorsProp,
    color1,
    color2,
    color3,
    color4,
  ]);

  return (
    <div
      className={cn(
        "relative size-full overflow-hidden pointer-events-none select-none",
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      <PaperMeshGradient
        width="100%"
        height="100%"
        colors={colors}
        distortion={distortion}
        swirl={swirl}
        speed={speed}
        scale={scale}
        rotation={rotation}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
});

MeshGradient.displayName = "MeshGradient";

export default MeshGradient;