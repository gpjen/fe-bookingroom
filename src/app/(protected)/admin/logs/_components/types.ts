export type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type LogStatus = "SUCCESS" | "FAILURE";

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  action: string;
  module: string;
  message: string;
  user: {
    name: string;
    nik: string;
    role: string;
    avatar?: string;
  };
  ipAddress: string;
  userAgent: string;
  status: LogStatus;
  details?: string;
}
