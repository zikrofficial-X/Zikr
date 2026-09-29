// @ts-nocheck - Game implementation with Phaser physics engine
"use client";

import { useEffect, useRef, useState } from "react";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type ColoringHud = {
  score: number;
  collectibles: number;
  progress: number;
};

export type ColoringCallbacks = {
  onReady: () => void;
  onHud: (hud: ColoringHud) => void;
  onGameOver: (hud: ColoringHud) => void;
};

const COLORS = ["#5fd1a6", "#f3c969", "#2f8a9e", "#e28a5a", "#ffd4a3"];

export default function ZikrColoringGame({ callbacks }: { callbacks: ColoringCallbacks }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [collectibles, setCollectibles] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const tone = new ToneFeedback("peaceful");

  useEffect(() => {
    callbacks.onReady();
  }, [callbacks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw simple shapes to color
    ctx.fillStyle = "#071b24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some circles and shapes as templates
    ctx.strokeStyle = "#f3c969";
    ctx.lineWidth = 3;

    // Circle
    ctx.beginPath();
    ctx.arc(150, 150, 100, 0, Math.PI * 2);
    ctx.stroke();

    // Square
    ctx.strokeRect(50, 350, 150, 150);

    // Triangle
    ctx.beginPath();
    ctx.moveTo(350, 250);
    ctx.lineTo(450, 350);
    ctx.lineTo(250, 350);
    ctx.closePath();
    ctx.stroke();
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = selectedColor;
    ctx.fillRect(x - 10, y - 10, 20, 20);

    // Update score
    setScore((s) => s + 10);
    setProgress((p) => Math.min(100, p + 2));
    tone.play("success");

    callbacks.onHud({
      score: score + 10,
      collectibles: collectibles,
      progress: Math.min(100, progress + 2),
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = selectedColor;
    ctx.fillRect(x - 10, y - 10, 20, 20);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#071b24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw shapes
    ctx.strokeStyle = "#f3c969";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(150, 150, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(50, 350, 150, 150);
    ctx.beginPath();
    ctx.moveTo(350, 250);
    ctx.lineTo(450, 350);
    ctx.lineTo(250, 350);
    ctx.closePath();
    ctx.stroke();
  };

  const handleComplete = () => {
    setCollectibles((c) => c + 50);
    setScore((s) => s + 500);
    tone.play("victory");

    callbacks.onGameOver({
      score: score + 500,
      collectibles: collectibles + 50,
      progress: 100,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold text-center text-amber-400">تلوين ذِكر</h2>

      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border-2 border-amber-400 rounded-lg cursor-crosshair w-full"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />

      <div className="flex gap-2 justify-center flex-wrap">
        {COLORS.map((color) => (
          <button
            key={color}
            className={`w-10 h-10 rounded border-2 transition ${
              selectedColor === color
                ? "border-white scale-125"
                : "border-amber-400/50"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-slate-700 text-cream rounded hover:bg-slate-600"
        >
          مسح
        </button>

        <button
          onClick={handleComplete}
          className="px-4 py-2 bg-emerald-600 text-cream rounded hover:bg-emerald-700"
        >
          انتهيت
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-center">
          <p className="text-amber-400 font-bold">التقدم: {progress}%</p>
          <div className="w-full bg-slate-800 rounded-full h-4 mt-2">
            <div
              className="bg-emerald-500 h-4 rounded-full transition"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 text-sm text-cream/70">
          <div>النقاط: {score}</div>
          <div>المجموع: {collectibles}</div>
        </div>
      </div>
    </div>
  );
}
