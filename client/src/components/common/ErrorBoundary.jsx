import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(/*error*/) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h1>Нещо се обърка!</h1>
                    <p>Моля, презаредете страницата или се върнете към началната страница.</p>
                    <button
                        className="btn"
                        onClick={() => window.location.href = '/'}
                    >
                        Към началната страница
                    </button>
                    {this.state.error && (
                        <details>
                            <summary>Детайли за грешката (за разработчици)</summary>
                            <pre>{this.state.error.toString()}</pre>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}