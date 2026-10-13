type Row = Record<string, unknown>;
export type ApiResult = { data: any; error: { message: string; code?: string } | null };
export async function requestApi(path: string, options: RequestInit = {}): Promise<ApiResult> {
  try {
    const response = await fetch(`/api${path}`, {
      ...options, credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const body = await response.json();
    return response.ok ? { data: body.data, error: null }
      : { data: null, error: { message: body.error ?? "Request failed", code: body.code } };
  } catch {
    return { data: null, error: { message: "Cannot reach the store server. Please try again shortly." } };
  }
}
class ApiQuery implements PromiseLike<ApiResult> {
  private table: string;
  private method = "GET";
  private payload?: Row;
  private filters: [string, unknown][] = [];
  private sort?: { column: string; ascending: boolean };
  private one = false;
  constructor(table: string) { this.table = table; }
  select(_columns = "*") { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order(column: string, options: { ascending?: boolean } = {}) {
    this.sort = { column, ascending: options.ascending ?? true }; return this;
  }
  insert(payload: Row) { this.method = "POST"; this.payload = payload; return this; }
  update(payload: Row) { this.method = "PATCH"; this.payload = payload; return this; }
  delete() { this.method = "DELETE"; return this; }
  single() { this.one = true; return this; }
  private async execute() {
    const id = this.filters.find(([column]) => column === "id")?.[1];
    if ((this.method === "PATCH" || this.method === "DELETE") && typeof id !== "string")
      return { data: null, error: { message: "A record ID is required." } };
    const params = new URLSearchParams();
    for (const [column, value] of this.filters) params.set(column, String(value));
    if (this.sort) { params.set("sort", this.sort.column); params.set("ascending", String(this.sort.ascending)); }
    const result = await requestApi(`/${this.table}${id ? `/${encodeURIComponent(String(id))}` : ""}?${params}`, {
      method: this.method, body: this.payload ? JSON.stringify(this.payload) : undefined,
    });
    if (this.one && Array.isArray(result.data)) result.data = result.data[0] ?? null;
    return result;
  }
  then<TResult1 = ApiResult, TResult2 = never>(
    onfulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }
}
export const database = {
  from: (table: string) => new ApiQuery(table),
  rpc: (_name: "place_order", payload: Row) => requestApi("/orders", { method: "POST", body: JSON.stringify(payload) }),
};
