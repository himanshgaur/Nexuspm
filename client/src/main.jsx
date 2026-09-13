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
  SignUp,
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

function AuthScreen() {
  const [isSignUp, setIsSignUp] = React.useState(() => {
    return window.location.hash.includes("signup") || window.location.pathname.includes("sign-up");
  });

  React.useEffect(() => {
    const handleHash = () => {
      setIsSignUp(window.location.hash.includes("signup") || window.location.pathname.includes("sign-up"));
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-glow mb-1">
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">NexusPM</h1>
          <p className="text-xs text-slate-400">
            {isSignUp ? "Create a new account to join or manage projects" : "Sign in to access your organization workspace"}
          </p>
        </div>

        {/* Tab Switcher for Sign In vs Sign Up */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              window.location.hash = "signin";
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              window.location.hash = "signup";
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isSignUp ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp
              routing="hash"
              signInUrl="#signin"
              fallbackRedirectUrl="/"
              forceRedirectUrl="/"
            />
          ) : (
            <SignIn
              routing="hash"
              signUpUrl="#signup"
              fallbackRedirectUrl="/"
              forceRedirectUrl="/"
            />
          )}
        </div>
      </div>
    </div>
  );
}

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
        <AuthScreen />
      </SignedOut>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {hasValidClerkKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
      >
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
