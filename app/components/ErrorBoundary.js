"use client";

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: false }; // Return false to prevent showing errors
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error here if needed
    console.log('Suppressed error:', error);
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary; 