import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "80vh", padding: "2rem" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
