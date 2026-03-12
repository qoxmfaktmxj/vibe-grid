import { NextResponse } from "next/server";
import {
  buildGridLabServerResult,
  parseGridQuerySearchParams,
} from "../../../../features/grid-lab/model";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseGridQuerySearchParams(url.searchParams);
  const result = buildGridLabServerResult(query);

  return NextResponse.json(result);
}
