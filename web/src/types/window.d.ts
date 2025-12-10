export {};

declare global {
  interface Window {
    invokeNative?: (native: string, ...args: unknown[]) => void;
    GetParentResourceName?: () => string;
  }
}
