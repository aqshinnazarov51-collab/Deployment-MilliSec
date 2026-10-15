import { NextResponse } from "next/server";

export const SAFE_ERROR_MESSAGE = "Произошла ошибка. Попробуйте позже.";

type ApiHandler<Args extends unknown[]> = (...args: Args) => Response | Promise<Response>;

export function withApiErrorBoundary<Args extends unknown[]>(name: string, handler: ApiHandler<Args>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorType = error instanceof Error ? error.name : "UnknownError";
      console.error(`[api:${name}] request failed (${errorType})`);
      return NextResponse.json(
        { error: SAFE_ERROR_MESSAGE },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
