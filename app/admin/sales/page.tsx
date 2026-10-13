import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 25;
const statuses = ["COMPLETED", "PENDING", "FAILED", "PAID", "REFUNDED"] as const;
type SortField = "createdAt" | "amount" | "status" | "id";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function nextDate(date: Date) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

export default async function AdminSalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 100);
  const requestedStatus = first(params.status).toUpperCase();
  const status = statuses.includes(requestedStatus as typeof statuses[number]) ? requestedStatus : "";
  const fromValue = first(params.from);
  const toValue = first(params.to);
  const fromDate = validDate(fromValue);
  const toDate = validDate(toValue);
  const sortValue = first(params.sort);
  const sortFields: SortField[] = ["createdAt", "amount", "status", "id"];
  const sort: SortField = sortFields.includes(sortValue as SortField) ? sortValue as SortField : "createdAt";
  const direction = first(params.direction) === "asc" ? "asc" : "desc";
  const requestedPage = Number.parseInt(first(params.page), 10);

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (query) {
    where.OR = [
      { id: { contains: query } },
      { user: { is: { firstName: { contains: query } } } },
      { user: { is: { lastName: { contains: query } } } },
      { user: { is: { email: { contains: query } } } },
      { user: { is: { profile: { is: { phone: { contains: query } } } } } },
      { course: { is: { title: { contains: query } } } },
    ];
  }
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lt: nextDate(toDate) } : {}),
    };
  }

  const paidWhere: Prisma.OrderWhereInput = { status: { in: ["COMPLETED", "PAID"] } };
  const [filteredCount, revenue, saleCount, buyerCount] = await Promise.all([
    db.order.count({ where }),
    db.order.aggregate({ where: paidWhere, _sum: { amount: true } }),
    db.order.count({ where: paidWhere }),
    db.user.count({ where: { orders: { some: paidWhere } } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const orderBy: Prisma.OrderOrderByWithRelationInput = sort === "amount"
    ? { amount: direction }
    : sort === "status"
      ? { status: direction }
      : sort === "id"
        ? { id: direction }
        : { createdAt: direction };
  const orders = await db.order.findMany({
    where,
    orderBy: [orderBy, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      user: { include: { profile: { select: { phone: true } } } },
      course: { select: { title: true } },
      payment: { select: { status: true } },
    },
  });

  function hrefWith(overrides: Record<string, string>) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (fromDate) next.set("from", fromValue);
    if (toDate) next.set("to", toValue);
    next.set("sort", sort);
    next.set("direction", direction);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) next.set(key, value);
    return `/admin/sales?${next.toString()}`;
  }

  function sortHref(field: SortField) {
    const nextDirection = sort === field && direction === "asc" ? "desc" : "asc";
    return hrefWith({ sort: field, direction: nextDirection, page: "1" });
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "UTC", timeZoneName: "short",
  });

  return (
    <main className="shell" style={{ paddingTop: 38, paddingBottom: 60 }}>
      <div className="page-title-row">
        <div><div className="eyebrow">Lumio operations</div><h1>Sales and purchases</h1><p>Review every recorded order, payment status, and buyer.</p></div>
        <Link href="/admin" className="button button-outline button-small">Admin console</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><small>Total revenue</small><strong>{money(revenue._sum.amount ?? 0)}</strong></div>
        <div className="stat-card"><small>Successful sales</small><strong>{saleCount.toLocaleString()}</strong></div>
        <div className="stat-card"><small>Paying customers</small><strong>{buyerCount.toLocaleString()}</strong></div>
      </div>

      <section className="panel" aria-label="Filter sales">
        <form action="/admin/sales" method="get" style={{ display: "flex", alignItems: "end", flexWrap: "wrap", gap: 10 }}>
          <div className="field" style={{ flex: "1 1 220px", margin: 0 }}><label htmlFor="sales-search">Search</label><input id="sales-search" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Order, buyer, email, phone, or course" /></div>
          <div className="field" style={{ flex: "0 1 160px", margin: 0 }}><label htmlFor="sales-status">Payment status</label><select id="sales-status" name="status" defaultValue={status}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.toLowerCase()}</option>)}</select></div>
          <div className="field" style={{ flex: "0 1 150px", margin: 0 }}><label htmlFor="sales-from">From</label><input id="sales-from" type="date" name="from" defaultValue={fromDate ? fromValue : ""} /></div>
          <div className="field" style={{ flex: "0 1 150px", margin: 0 }}><label htmlFor="sales-to">To</label><input id="sales-to" type="date" name="to" defaultValue={toDate ? toValue : ""} /></div>
          <div className="field" style={{ flex: "0 1 135px", margin: 0 }}><label htmlFor="sales-sort">Sort by</label><select id="sales-sort" name="sort" defaultValue={sort}><option value="createdAt">Purchase date</option><option value="amount">Amount</option><option value="status">Status</option><option value="id">Order ID</option></select></div>
          <div className="field" style={{ flex: "0 1 125px", margin: 0 }}><label htmlFor="sales-direction">Order</label><select id="sales-direction" name="direction" defaultValue={direction}><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
          <button className="button button-small">Apply filters</button>
          <Link href="/admin/sales" className="button button-outline button-small">Clear</Link>
        </form>
      </section>

      <section className="panel" style={{ overflowX: "auto" }}>
        <div className="panel-header"><h2>Transactions</h2><span className="small-note">{filteredCount.toLocaleString()} results · UTC timestamps</span></div>
        <table className="data-table">
          <thead><tr>
            <th><Link className="text-link" href={sortHref("id")}>Order ID</Link></th>
            <th>Buyer</th>
            <th>Course</th>
            <th><Link className="text-link" href={sortHref("createdAt")}>Purchased at</Link></th>
            <th><Link className="text-link" href={sortHref("amount")}>Amount</Link></th>
            <th><Link className="text-link" href={sortHref("status")}>Payment status</Link></th>
          </tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><code title={order.id}>{order.id}</code></td>
                <td><strong>{order.user.firstName} {order.user.lastName}</strong><div className="small-note">{order.user.email}</div>{order.user.profile?.phone && <div className="small-note">{order.user.profile.phone}</div>}</td>
                <td>{order.course.title}</td>
                <td><time dateTime={order.createdAt.toISOString()}>{dateFormatter.format(order.createdAt)}</time></td>
                <td>{money(order.amount)}</td>
                <td>{(order.payment?.status ?? order.status).toLowerCase()}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6} className="small-note">No transactions match these filters.</td></tr>}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 18 }}>
          <span className="small-note">Page {page} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Link aria-disabled={page <= 1} style={{ pointerEvents: page <= 1 ? "none" : undefined, opacity: page <= 1 ? 0.5 : undefined }} className="button button-outline button-small" href={hrefWith({ page: String(Math.max(1, page - 1)) })}>Previous</Link>
            <Link aria-disabled={page >= totalPages} style={{ pointerEvents: page >= totalPages ? "none" : undefined, opacity: page >= totalPages ? 0.5 : undefined }} className="button button-outline button-small" href={hrefWith({ page: String(Math.min(totalPages, page + 1)) })}>Next</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
