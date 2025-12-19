import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { socket } from "../services/socket";

export default function Project() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    API.get(`/projects/${id}`).then(res => setProject(res.data));

    socket.emit("joinProject", { projectId: id });

    socket.on("chat:message", msg => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("chat:message");
  }, [id]);

  const send = () => {
    socket.emit("chat:message", {
      projectId: id,
      text
    });
    setText("");
  };

  if (!project) return <p>Loading...</p>;

  return (
    <section className="page">
      <h1>{project.title}</h1>
      <p>{project.description}</p>

      <h2>Chat</h2>

      <div className="card">
        {messages.map((m, i) => (
          <p key={i}>{m.text}</p>
        ))}

        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={send}>Send</button>
      </div>
    </section>
  );
}
