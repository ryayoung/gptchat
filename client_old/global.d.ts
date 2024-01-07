
declare global {
    interface Window {
        log: (...data: any[]) => void;
    }
}
