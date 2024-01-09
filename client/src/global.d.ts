
declare global {
    function log(...data: any[]): void;

    interface Window {
        Plotly: any;
    }
}

export {};
