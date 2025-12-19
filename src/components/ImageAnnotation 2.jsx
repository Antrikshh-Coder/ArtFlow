import { useState, useRef, useEffect } from "react";
import API from "../api/api";
import { socket, connectSocket } from "../services/socket";
import "./ImageAnnotation.css";

export default function ImageAnnotation({ projectId, user }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState("pen");
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const [annotations, setAnnotations] = useState([]);
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchAnnotations = async () => {
      try {
        const res = await API.get(`/projects/${projectId}`);
        const project = res.data;
        const next = project?.milestones?.[0]?.annotations || [];
        setAnnotations(next);
      } catch (err) {
        console.error("Failed to fetch annotations:", err);
      }
    };

    fetchAnnotations();

    connectSocket();

    const onNewAnnotation = (payload) => {
      const incoming = payload?.annotation;
      if (!incoming) return;
      setAnnotations((prev) => {
        const incomingId = incoming?._id;
        if (incomingId && prev.some((a) => String(a._id) === String(incomingId))) return prev;
        return [...prev, incoming];
      });
    };

    socket.emit("join-project", projectId);
    socket.on("annotation:new", onNewAnnotation);

    return () => {
      socket.off("annotation:new", onNewAnnotation);
      socket.emit("leave-project", projectId);
    };
  }, [projectId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentTool === "pen" ? 2 : 4;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    
    // Save annotation immediately without popup
    const annotationData = {
      tool: currentTool,
      color: currentColor,
      imageData: imageData,
      comment: "Drawing annotation"
    };

    // Save directly without requiring user input
    API.post(`/projects/${projectId}/milestones/0/annotations`, annotationData)
      .then(res => {
        setAnnotations(prev => [...prev, res.data.annotation]);

        socket.emit("annotation:created", {
          projectId,
          annotation: res.data.annotation
        });
        
        // Clear canvas
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      })
      .catch(err => {
        console.error("Failed to save annotation:", err);
      });
  };

  const saveAnnotation = async () => {
    if (!currentAnnotation || !comment.trim()) return;

    const annotationData = {
      tool: currentAnnotation.tool,
      color: currentAnnotation.color,
      imageData: currentAnnotation.imageData,
      comment: comment.trim()
    };

    try {
      const res = await API.post(`/projects/${projectId}/milestones/0/annotations`, annotationData);
      
      setAnnotations(prev => [...prev, res.data.annotation]);

      socket.emit("annotation:created", {
        projectId,
        annotation: res.data.annotation
      });
      
      // Clear canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setShowCommentInput(false);
      setComment("");
      setCurrentAnnotation(null);
    } catch (err) {
      console.error("Failed to save annotation:", err);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setShowCommentInput(false);
    setCurrentAnnotation(null);
  };

  return (
    <div className="annotation-container">
      <div className="annotation-header">
        <h3>Image Annotations</h3>
        <div className="annotation-tools">
          <select
            value={currentTool}
            onChange={(e) => setCurrentTool(e.target.value)}
          >
            <option value="pen">Pen</option>
            <option value="highlighter">Highlighter</option>
          </select>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
          />
          <button onClick={clearCanvas}>Clear</button>
        </div>
      </div>

      <div className="annotation-workspace">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="annotation-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>

      <div className="annotations-list">
        <h4>Previous Annotations</h4>
        {annotations.length === 0 ? (
          <p>No annotations yet</p>
        ) : (
          annotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <div className="annotation-header-info">
                <span className="author">{annotation.author?.name}</span>
                <span className="timestamp">
                  {new Date(annotation.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="annotation-comment">
                {annotation.comment}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
