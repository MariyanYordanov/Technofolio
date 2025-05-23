import { useContext } from "react";
import AuthContext from "../contexts/AuthContext.jsx";

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth трябва да се използва в AuthProvider");
    }
    return context;
};

export default useAuth;
