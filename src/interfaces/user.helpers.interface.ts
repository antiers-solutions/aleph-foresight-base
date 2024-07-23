interface ApiResponse {
  error?: boolean;
  data?: any;
  message?: string;
  status?: number;
  token?: string;
}
interface DecodedToken {
  wallet_address: string;
}
interface UploadResponse {
  error: boolean;
  data?: any;
  message: string;
  status?: number;
}
export { ApiResponse, DecodedToken,UploadResponse };
