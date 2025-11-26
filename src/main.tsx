import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const rootElement = document.getElementById("root")!;

const appTree = clerkPublishableKey ? (
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <App />
  </ClerkProvider>
) : (
  <App />
);

createRoot(rootElement).render(appTree);
