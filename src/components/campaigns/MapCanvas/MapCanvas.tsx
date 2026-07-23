import React, { useRef, useEffect, useCallback } from "react";
import { Scene, Token } from "../../../types/campaigns";

interface MapCanvasProps {
  activeScene: Scene;
  mapUrl: string | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  activeScene,
  mapUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  console.log("mapUrl: ", mapUrl);
  console.log("activeScene: ", activeScene);

  // Draw Grid Lines onto Canvas
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!activeScene.gridEnabled) return;

    // Calculate grid size relative to scale if needed, or use base size
    const gridSize = activeScene.gridSize || 50;
    ctx.strokeStyle = activeScene.gridColor || "#ffffff33";
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }, [activeScene.gridEnabled, activeScene.gridSize, activeScene.gridColor]);

  // Sync canvas dimensions to the current rendered size of the image
  const updateCanvasDimensions = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    if (img.clientWidth > 0 && img.clientHeight > 0) {
      // Set actual canvas pixel buffer dimensions
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;

      // Force canvas style dimensions to match the image dimensions
      canvas.style.width = `${img.clientWidth}px`;
      canvas.style.height = `${img.clientHeight}px`;

      drawGrid();
    }
  }, [activeScene, drawGrid]);

  // Re-draw grid when settings change
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // Handle image load and attach ResizeObserver to handle window resizing dynamically
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new ResizeObserver(() => {
      updateCanvasDimensions();
    });

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [updateCanvasDimensions]);

  return (
    <>
      <div>Map</div>
    </>
  );

  // return (
  //   <div
  //     className="map-canvas-container"
  //     onDragOver={(e) => {
  //       e.preventDefault();
  //       e.dataTransfer.dropEffect = "copy";
  //     }}
  //     onDragEnter={(e) => e.preventDefault()}
  //   >
  //     {mapUrl ? (
  //       <div
  //         ref={mapWrapperRef}
  //         style={{
  //           position: "relative",
  //           width: "100%",
  //           height: "100%",
  //           display: "flex",
  //           justifyContent: "center",
  //           alignItems: "center",
  //         }}
  //       >
  //         <img
  //           ref={imgRef}
  //           src={mapUrl}
  //           alt={activeScene.name}
  //           onLoad={updateCanvasDimensions}
  //           style={{
  //             maxWidth: "100%",
  //             maxHeight: "100%",
  //             width: "auto",
  //             height: "auto",
  //             objectFit: "contain",
  //             display: "block",
  //             pointerEvents: "none",
  //           }}
  //         />
  //         <canvas
  //           ref={canvasRef}
  //           style={{
  //             position: "absolute",
  //             top: "50%",
  //             left: "50%",
  //             transform: "translate(-50%, -50%)",
  //             pointerEvents: "none",
  //           }}
  //         />
  //         {/* Token Layer */}
  //         <div
  //           style={{
  //             position: "absolute",
  //             top: "50%",
  //             left: "50%",
  //             transform: "translate(-50%, -50%)",
  //             width: canvasRef.current?.width || "100%",
  //             height: canvasRef.current?.height || "100%",
  //             pointerEvents: "none",
  //           }}
  //         >
  //           {activeScene.tokens?.map((token) => (
  //             <div
  //               key={token.id}
  //               style={{
  //                 position: "absolute",
  //                 left: `${token.x}px`,
  //                 top: `${token.y}px`,
  //                 width: `${(activeScene.gridSize || 50) * (token.size || 1)}px`,
  //                 height: `${(activeScene.gridSize || 50) * (token.size || 1)}px`,
  //                 pointerEvents: "auto",
  //                 cursor: "move",
  //               }}
  //             >
  //               {token.imageUrl ? (
  //                 <img
  //                   src={token.imageUrl}
  //                   alt={token.name}
  //                   style={{
  //                     width: "100%",
  //                     height: "100%",
  //                     borderRadius: "50%",
  //                     objectFit: "cover",
  //                   }}
  //                 />
  //               ) : (
  //                 <div
  //                   style={{
  //                     width: "100%",
  //                     height: "100%",
  //                     borderRadius: "50%",
  //                     backgroundColor: "#3b82f6",
  //                     color: "#fff",
  //                     display: "flex",
  //                     alignItems: "center",
  //                     justifyContent: "center",
  //                     fontWeight: "bold",
  //                     fontSize: "0.8rem",
  //                     border: "2px solid #ffffff",
  //                     boxSizing: "border-box",
  //                   }}
  //                 >
  //                   {token.name.substring(0, 2).toUpperCase()}
  //                 </div>
  //               )}
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     ) : (
  //       <p style={{ color: "#71717a" }}>No active map loaded.</p>
  //     )}
  //   </div>
  // );
};
