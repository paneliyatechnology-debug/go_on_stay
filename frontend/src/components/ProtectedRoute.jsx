import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading GoOnStay...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && !user.is_superuser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="card-white p-8 rounded-3xl max-w-md text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-2xl font-black">!</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Your account role ({user.role}) does not have permissions to view this portal. Hotel Owner or Admin privileges are required.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => window.history.back()}
              className="btn-dark py-2.5 px-5 text-xs"
            >
              Go Back
            </button>
            <a
              href="/"
              className="btn-teal py-2.5 px-5 text-xs"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
