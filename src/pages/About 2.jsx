export default function About() {
    return (
      <section className="page">
        <h1>About ArtFlow</h1>
  
        <p>
          ArtFlow is a real-time digital art commissioning platform designed to
          eliminate confusion, delays, and scattered communication in creative
          collaborations.
        </p>
  
        <p>
          Traditional commissioning relies on emails, DMs, and unclear feedback.
          ArtFlow replaces this with a shared workspace where artists and clients
          collaborate visually and instantly.
        </p>
  
        <div className="grid">
          <div className="card">
            <h3>🎯 Our Vision</h3>
            <p>
              To empower artists and clients with a transparent, structured,
              and enjoyable commissioning experience.
            </p>
          </div>
  
          <div className="card">
            <h3>🛠 Built With</h3>
            <p>
              MERN Stack, Socket.IO, MongoDB, AWS S3, JWT Authentication.
            </p>
          </div>
        </div>
      </section>
    );
  }
  