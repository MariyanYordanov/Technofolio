import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../../contexts/AuthContext";

export default function Logout() {
    const { logoutHandler } = useContext(AuthContext);

    useEffect(() => {
        logoutHandler();
    }, [logoutHandler]);

    return <Navigate to="/login" />;
}