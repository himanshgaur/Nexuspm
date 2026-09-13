import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthOrgProvider } from "./context/AuthOrgContext.jsx";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  ClerkLoaded,
  ClerkLoading,
  useUser,
  useAuth,
} from "@clerk/clerk-react";

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_c21hc2hpbmctc3VuZmlzaC00MDY1LmNsZXJrLmFjY291bnRzLmRldiQ";

const hasValidClerkKey = Boolean(clerkPublishableKey && !clerkPublishableKey.includes("sample"));

function ClerkAuthBridge() {
  const { user } = useUser();
  const { getToken } = useAuth();

  return (
    <>
      <SignedIn>
        <AuthOrgProvider clerkUser={user} getToken={getToken}>
          <App hasClerk={true} />
        </AuthOrgProvider>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-glow mb-2">
                <span className="text-2xl font-black text-white">N</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">NexusPM</h1>
              <p className="text-xs text-slate-400">Sign in to access your organization workspace</p>
            </div>
            <div className="flex justify-center">
              <SignIn routing="hash" />
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {hasValidClerkKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ClerkLoading>
          <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Initializing workspace session...</span>
            </div>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <ClerkAuthBridge />
        </ClerkLoaded>
      </ClerkProvider>
    ) : (
      <AuthOrgProvider>
        <App />
      </AuthOrgProvider>
    )}
  </React.StrictMode>
);
