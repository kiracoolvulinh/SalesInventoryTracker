import { useState, ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-4 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
