import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface DirectionAwareHoverProps {
  imageUrl: string;
  overlayImageUrl?: string;
  children: React.ReactNode;
  className?: string;
  enableGrayscale?: boolean;
  showGradient?: boolean;
  showLastUpdated?: boolean;
  lastUpdated?: string;
  alwaysShowText?: boolean;
}

export const DirectionAwareHover: React.FC<DirectionAwareHoverProps> = ({
  imageUrl,
  overlayImageUrl,
  children,
  className = "",
  enableGrayscale = false,
  showGradient = false,
  showLastUpdated = false,
  lastUpdated,
  alwaysShowText = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<string>("left");
  const [isHovered, setIsHovered] = useState(false);
  const [overlayLoaded, setOverlayLoaded] = useState(false);
  const [baseLoaded, setBaseLoaded] = useState(false);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const dir = getDirection(event, ref.current);
    setDirection(dir);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const getDirection = (
    event: React.MouseEvent<HTMLDivElement>,
    element: HTMLDivElement
  ) => {
    const { width, height, top, left } = element.getBoundingClientRect();
    const x = (event.clientX - left - width / 2) * (width > height ? height / width : 1);
    const y = (event.clientY - top - height / 2) * (height > width ? width / height : 1);
    const d = Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4;
    return ["top", "right", "bottom", "left"][d] || "left";
  };


  return (
    <motion.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <>
        {/* Overlay image - visible when not hovered */}
        {overlayImageUrl && (
          <motion.img
            src={overlayImageUrl}
            alt=""
            className="album-cover absolute inset-0 w-full h-full object-cover z-10"
            style={{
              filter: enableGrayscale ? 'grayscale(100%)' : 'none',
            }}
            initial={{ opacity: 0 }}
            animate={
              isHovered
                ? { 
                    scale: 1.2, 
                    x: direction === 'left' ? 15 : direction === 'right' ? -15 : 0,
                    y: direction === 'top' ? 15 : direction === 'bottom' ? -15 : 0,
                    opacity: 0 
                  }
                : { 
                    scale: 1.2, 
                    x: 0, 
                    y: 0,
                    opacity: overlayLoaded ? 1 : 0
                  }
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            onLoad={() => setOverlayLoaded(true)}
          />
        )}
        {/* Original version - always visible underneath */}
        <motion.img
          src={imageUrl}
          alt=""
          className="album-cover absolute inset-0 w-full h-full object-cover z-0"
          initial={{ opacity: 0 }}
          animate={{
            scale: 1.2, 
            x: isHovered ? (direction === 'left' ? 15 : direction === 'right' ? -15 : 0) : 0,
            y: isHovered ? (direction === 'top' ? 15 : direction === 'bottom' ? -15 : 0) : 0,
            opacity: baseLoaded ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onLoad={() => setBaseLoaded(true)}
        />
      </>
      {/* Gradient overlay */}
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-20" />
      )}
      {/* Text overlay */}
      {(isHovered || alwaysShowText) && (
        <motion.div
          className="absolute inset-0 flex items-end justify-start p-2 md:p-4 z-30"
          initial={{ opacity: alwaysShowText ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: alwaysShowText ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-white drop-shadow-lg text-xs md:text-sm">
            {children}
            {showLastUpdated && lastUpdated && (
              <p className="text-xs opacity-70 mt-1 text-rough">Last Updated: {lastUpdated}</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
