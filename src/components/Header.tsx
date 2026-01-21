import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header 
      className="sticky top-0 z-50 border-b border-[#1a1a1a]/10 px-4 py-2"
      style={{
        background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center">
          <Link to="/cabinet" className="cursor-pointer">
            <img src={logo} alt="Balansity" className="h-8 w-auto" />
          </Link>
        </div>
      </div>
    </header>
  );
};
