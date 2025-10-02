import { useRef, useState, useEffect } from "react";
import { ArrowRightIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [aspect, setAspect] = useState("1:1");
  const [strength, setStrength] = useState(0.6);

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [savedProjects, setSavedProjects] = useState<
    { prompt: string; style: string; aspect: string; img: string }[]
  >([]);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);

  // ---- Prompt Suggestions ----
  const getSuggestions = async () => {
    setPromptSuggestions(["Yükleniyor..."]);
    try {
      const res = await fetch("/api/suggest?topic=" + encodeURIComponent(prompt || "AI art"));
      const data = await res.json();
      setPromptSuggestions(data.suggestions || []);
    } catch {
      setPromptSuggestions(["Öneri alınamadı"]);
    }
  };

  // ---- Canvas Functions ----
  const getCtx = () => canvasRef.current?.getContext("2d")!;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(pan.x, pan.y);
    ctx.beginPath();
    ctx.moveTo(
      (e.nativeEvent.offsetX - pan.x) / scale,
      (e.nativeEvent.offsetY - pan.y) / scale
    );
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    setDrawing(true);
    setUndoStack((prev) => [...prev, canvasRef.current!.toDataURL()]);
    ctx.restore();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = getCtx();
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(pan.x, pan.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(
      (e.nativeEvent.offsetX - pan.x) / scale,
      (e.nativeEvent.offsetY - pan.y) / scale
    );
    ctx.stroke();
    ctx.restore();
  };

  const stopDraw = () => setDrawing(false);

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack.pop()!;
    setRedoStack((prev) => [...prev, canvasRef.current!.toDataURL()]);
    const ctx = getCtx();
    const img = new Image();
    img.src = last;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
    };
    setUndoStack([...undoStack]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack.pop()!;
    setUndoStack((prev) => [...prev, canvasRef.current!.toDataURL()]);
    const ctx = getCtx();
    const img = new Image();
    img.src = last;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
    };
    setRedoStack([...redoStack]);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    setScale((prev) => Math.max(0.2, prev + e.deltaY * -0.001));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      setIsPanning(true);
    } else {
      startDraw(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: pan.x + e.movementX, y: pan.y + e.movementY });
    } else draw(e);
  };

  const handleMouseUp = () => {
    setDrawing(false);
    setIsPanning(false);
  };

  // ---- AI Generate ----
  const generateImage = async () => {
    setLoading(true);
    const dataURL = canvasRef.current!.toDataURL("image/png");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageData: dataURL, strength, style, aspect }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.imageUrl) setResults([data.imageUrl]);
  };

  // ---- Local Storage ----
  const saveProject = () => {
    const img = canvasRef.current!.toDataURL("image/png");
    const project = { prompt, style, aspect, img };
    const updated = [project, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
  };

  useEffect(() => {
    const stored = localStorage.getItem("projects");
    if (stored) setSavedProjects(JSON.parse(stored));
  }, []);

  const loadProject = (p: { prompt: string; style: string; aspect: string; img: string }) => {
    const ctx = getCtx();
    const img = new Image();
    img.src = p.img;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
    };
    setPrompt(p.prompt);
    setStyle(p.style);
    setAspect(p.aspect);
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai_sketch.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* HEADER */}
      <header className="flex justify-between p-4 shadow bg-white">
        <h1 className="font-bold text-2xl text-indigo-600">AI Sketch Studio</h1>
        <button
          onClick={saveProject}
          className="px-3 py-1 bg-indigo-500 text-white rounded-md"
        >
          Kaydet
        </button>
      </header>

      {/* MAIN */}
      <main className="grid md:grid-cols-3 gap-4 p-4">
        {/* Canvas Area */}
        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">🖌️ Çizim Alanı</h2>
          <p className="text-sm text-gray-500 mb-3">
            Fare ile çizim yap. Orta tuş veya Space basılı tutarak kaydır, tekerlekle zoom yap.
          </p>

          <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="bg-white"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
            <div
              className="pointer-events-none absolute inset-0 
                bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),
                    linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)]
                bg-[size:20px_20px] opacity-20"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={undo} className="px-3 py-1 bg-gray-200 rounded">
              Undo
            </button>
            <button onClick={redo} className="px-3 py-1 bg-gray-200 rounded">
              Redo
            </button>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-10 h-8"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="bg-white p-4 rounded shadow flex flex-col gap-3">
          <input
            className="p-2 border rounded w-full"
            placeholder="Prompt gir"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button onClick={getSuggestions} className="text-sm underline text-indigo-500 text-left">
            Prompt önerileri al
          </button>
          {promptSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {promptSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="px-2 py-1 bg-gray-200 rounded text-sm"
                  onClick={() => setPrompt(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <select value={style} onChange={(e) => setStyle(e.target.value)} className="p-2 border rounded">
            {["Realistic", "Cartoon", "Anime", "Digital Art"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="p-2 border rounded">
            {["1:1", "16:9", "9:16"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <label className="text-sm">Çizime bağlılık {strength}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
          />

          <button
            onClick={generateImage}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "..." : "Üret"} <ArrowRightIcon className="h-5 w-5" />
          </button>

          {results.map((img, i) => (
            <div key={i} className="mt-2">
              <img src={img} alt="" className="rounded" />
              <button
                onClick={() => downloadImage(img)}
                className="text-sm text-indigo-500 mt-1 flex items-center gap-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> İndir
              </button>
            </div>
          ))}

          {savedProjects.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold mb-1">Kaydedilenler</h4>
              {savedProjects.map((p, i) => (
                <button
                  key={i}
                  onClick={() => loadProject(p)}
                  className="block text-left text-sm w-full truncate hover:underline"
                >
                  {p.prompt} ({p.style}, {p.aspect})
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
