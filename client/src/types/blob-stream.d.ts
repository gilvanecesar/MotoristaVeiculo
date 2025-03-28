declare module 'blob-stream' {
  interface BlobStream {
    pipe(stream: any): BlobStream;
    toBlobURL(contentType: string): string;
    on(event: string, callback: (error?: any) => void): void;
  }
  
  function blobStream(): BlobStream;
  export default blobStream;
}