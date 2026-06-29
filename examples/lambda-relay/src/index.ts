export interface LambdaRelayEvent {
  body?: string | undefined;
}

export interface LambdaRelayResult {
  statusCode: number;
  body: string;
}

export async function handler(_event: LambdaRelayEvent): Promise<LambdaRelayResult> {
  return {
    statusCode: 501,
    body: JSON.stringify({
      ok: false,
      error: 'lambda-relay is a scaffold only and remains TBD',
    }),
  };
}
