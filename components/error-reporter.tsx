"use client";

import { useEffect, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

const postError = (payload: unknown) => {
  try {
    window.parent?.postMessage(
      {
        source: "APP_RUNTIME_ERROR",
        ...payload,
      },
      "*"
    );
  } catch {
    // ignore
  }
};

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-6">An unexpected error occurred.</p>
      </div>
    </div>
  );
}

export function ReactErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        postError({
          type: "react-error",
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      fallback={<ErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const post = (payload: unknown) => {
      try {
        window.parent?.postMessage(
          {
            source: "APP_RUNTIME_ERROR",
            ...payload,
          },
          "*"
        );
      } catch {
        // ignore
      }
    };

    const onError = (event: ErrorEvent) => {
      post({
        type: "runtime-error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | string;

      post({
        type: "unhandled-rejection",
        message: typeof reason === "string" ? reason : reason?.message ?? "Unknown error",
        stack: typeof reason === "string" ? undefined : reason?.stack,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
