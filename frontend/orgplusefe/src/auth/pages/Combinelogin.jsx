import React from 'react'
import { useNavigate } from 'react-router-dom';

export default function Combinelogin() {

    const navigate = useNavigate();

   return (
    <div className="container vh-100 d-flex justify-content-center align-items-center" >
      <div className="card shadow p-5 text-center" style={{ width: "400px" }}>
        <h2 className="mb-4">Welcome to ORGPLUSE</h2>
        <p className="text-muted mb-4">
          Select your login type
        </p>

        <button
          className="btn btn-primary mb-3"  style={{
    background:
      "linear-gradient(13deg,#0f172a 0%,#1e3a5f 6%,#1e293b 100%)"}}
          onClick={() => navigate("/admin/login")}
        >
          Admin Login
        </button>

        <button
          className="btn btn-primary"
          style={{background:
            "linear-gradient(13deg,#1a0533 0%,#3b0f7a 6%,#1e293b 100%)"}}
          onClick={() => navigate("/employee/login")}
        >
          Employee Login
        </button>
        
      </div>
      
    </div>
    
  );
}


