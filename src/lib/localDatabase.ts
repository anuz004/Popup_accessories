import { fallbackProducts } from "@/data/products";

// A browser-only preview store. It never reads or writes a remote database.
type Row = Record<string, any>;
type Result = { data: any; error: { message: string; code?: string } | null };
const prefix = "grand-hour:demo:";
const tables = new Set(["products", "offers", "orders", "contact_messages", "newsletter_subscribers"]);
function read(table: string): Row[] {
  if (!tables.has(table)) throw new Error("Unknown demo table");
  const saved = localStorage.getItem(prefix + table);
  if (saved) return JSON.parse(saved);
  if (table !== "products") return [];
  return fallbackProducts.map((p) => ({
    ...p, original_price: p.originalPrice ?? null, case_color: p.caseColor,
    dial_color: p.dialColor, water_resistance: p.waterResistance,
    case_material: p.caseMaterial, strap_material: p.strapMaterial,
    case_size: p.caseSize, image_url: p.imageUrl ?? null,
    created_at: new Date().toISOString(),
  }));
}
class LocalQuery implements PromiseLike<Result> {
  private action: "read" | "insert" | "update" | "delete" = "read";
  private payload: Row = {};
  private filters: [string, unknown][] = [];
  private sort?: { column: string; ascending: boolean };
  private one = false;
  private table: string;
  constructor(table: string) { this.table = table; }
  select(_columns = "*") { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order(column: string, options: { ascending?: boolean } = {}) {
    this.sort = { column, ascending: options.ascending ?? true }; return this;
  }
  insert(payload: Row) { this.action = "insert"; this.payload = payload; return this; }
  update(payload: Row) { this.action = "update"; this.payload = payload; return this; }
  delete() { this.action = "delete"; return this; }
  single() { this.one = true; return this; }
  private execute(): Result {
    try {
      let rows = read(this.table);
      const matches = (row: Row) => this.filters.every(([key, value]) => row[key] === value);
      let result = rows.filter(matches);
      if (this.action === "insert") {
        if (this.table === "newsletter_subscribers" && rows.some(r => r.email === this.payload.email))
          return { data: null, error: { message: "Already subscribed", code: "23505" } };
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), active: true,
          rating: 0, reviews: 0, status: "new", starts_at: null, ends_at: null, ...this.payload };
        rows.push(row); result = [row];
      } else if (this.action === "update") {
        rows = rows.map(row => matches(row) ? { ...row, ...this.payload } : row);
        result = rows.filter(matches);
      } else if (this.action === "delete") {
        rows = rows.filter(row => !matches(row)); result = [];
      }
      if (this.action !== "read") localStorage.setItem(prefix + this.table, JSON.stringify(rows));
      if (this.sort) {
        const { column, ascending } = this.sort;
        result.sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1));
      }
      return { data: this.one ? result[0] ?? null : result, error: null };
    } catch {
      return { data: null, error: { message: "Browser storage is unavailable. Allow local storage to use the demo dashboard." } };
    }
  }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}
export const localDatabase = {
  from: (table: string) => new LocalQuery(table),
  rpc: async (): Promise<Result> => ({ data: null, error: { message: "Checkout is unavailable in local demo mode." } }),
};
export const demoCredentials = { email: "admin@grandhour.local", password: "GrandHourDemo123!" };
