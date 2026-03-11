import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../config.js';
import { UploadResponse } from './types.js';

export class RedmineApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly redmineErrors: string[],
    message: string,
  ) {
    super(message);
    this.name = 'RedmineApiError';
  }
}

export class RedmineClient {
  private readonly http: AxiosInstance;

  constructor(config: Config) {
    this.http = axios.create({
      baseURL: config.REDMINE_BASE_URL,
      headers: {
        'X-Redmine-API-Key': config.REDMINE_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError<{ errors?: string[] }>) => {
        const status = err.response?.status ?? 500;
        const errors = err.response?.data?.errors ?? [err.message];
        throw new RedmineApiError(status, errors, errors.join('; '));
      },
    );
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const res = await this.http.get<T>(`${path}.json`, { params });
    return res.data;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.http.post<T>(`${path}.json`, body);
    return res.data;
  }

  async put(path: string, body: unknown): Promise<void> {
    await this.http.put(`${path}.json`, body);
  }

  async delete(path: string): Promise<void> {
    await this.http.delete(`${path}.json`);
  }

  async upload(buffer: Buffer, filename: string): Promise<UploadResponse> {
    const res = await this.http.post<UploadResponse>(
      '/uploads.json',
      buffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        params: { filename },
      },
    );
    return res.data;
  }
}
