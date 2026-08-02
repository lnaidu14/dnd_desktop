import React, { useRef, useEffect, useCallback } from "react";
import { Scene } from "../../../types/campaigns";

interface MapCanvasProps {
  activeScene: Scene;
  mapUrl: string | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  activeScene,
  mapUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Draw Grid Lines onto Canvas
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!activeScene.gridEnabled) return;

    const gridSize = activeScene.gridSize || 50;
    ctx.strokeStyle = activeScene.gridColor || "rgba(255, 255, 255, 0.3)";
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

  // Sync canvas pixel dimensions to rendered image dimensions
  const updateCanvasDimensions = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    if (img.clientWidth > 0 && img.clientHeight > 0) {
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      canvas.style.width = `${img.clientWidth}px`;
      canvas.style.height = `${img.clientHeight}px`;
      drawGrid();
    }
  }, [drawGrid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new ResizeObserver(() => updateCanvasDimensions());
    observer.observe(img);

    return () => observer.disconnect();
  }, [updateCanvasDimensions]);

  if (!mapUrl) {
    return <p style={{ color: "#71717a" }}>No active map image loaded.</p>;
  }

  const gridSize = activeScene.gridSize || 50;

  return (
    <div
      className="map-canvas-container"
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {/* 1. Map Image */}
      <img
        ref={imgRef}
        src={mapUrl}
        alt={activeScene.name}
        onLoad={updateCanvasDimensions}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* 2. Grid Canvas Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />

      {/* 3. Rendered Scene Tokens */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {activeScene.tokens?.map((token) => (
          <div
            key={token.id}
            style={{
              position: "absolute",
              left: `${token.x}px`,
              top: `${token.y}px`,
              width: `${gridSize * (token.size || 1)}px`,
              height: `${gridSize * (token.size || 1)}px`,
              pointerEvents: "auto",
              cursor: "move",
            }}
          >
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.name}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  border: "2px solid #ffffff",
                  boxSizing: "border-box",
                }}
              >
                {token.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
