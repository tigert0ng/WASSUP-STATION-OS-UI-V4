import React from "react";

interface WassupLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  id?: string;
  alt?: string;
}

export default function WassupLogo({
  className = "h-12 w-auto",
  id = "wassup-brand-logo",
  alt = "WASSUP CAR WASH",
  ...props
}: WassupLogoProps) {
  return (
    <img
      id={id}
      src="/WASSUP-CMYK-A2C62C.svg"
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.endsWith("/wassup-logo.svg")) {
          target.src = "/wassup-logo.svg";
        }
      }}
      {...props}
    />
  );
}
