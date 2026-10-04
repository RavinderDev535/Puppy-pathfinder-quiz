import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#fdf8f3",
            color: "#2d2d2d",
          }}
        >
          <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "1rem", marginBottom: "2rem", maxWidth: "480px" }}>
            The quiz hit an unexpected error. Please refresh the page to try again.
            If the problem continues, contact support at customer_service@ezwhelp.com.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              backgroundColor: "#8b5a3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Reload Quiz
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
