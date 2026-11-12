import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { BackupControls } from "@/components/admin/BackupControls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DonationStatusBadge, RequestStatusBadge } from "@/components/status/StatusBadge";
import { useMe } from "@/hooks/useMe";
import { apiGet, apiPost } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/constants";
import { apiErrorMessage, fmtDate, fmtDateTime, fmtQty } from "@/lib/format";
import type {
  Donation,
  FoodRequest,
  PlatformStats,
  RequestStatus,
  User,
} from "@/types";

function KpiCard({
  label,
  value,
  sub,
  testId,
}: {
  label: string;
  value: string | number;
  sub?: string;
  testId: string;
}) {
  return (
    <Card size="sm" className="border-[#e2e8f0] bg-white">
      <CardContent className="py-5">
        <dd className="font-mono text-2xl font-semibold tracking-tight text-[#0f172a]" data-testid={testId}>
          {value}
        </dd>
        <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#475569]">
          {label}
        </dt>
        {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<PlatformStats>("/admin/stats"),
  });
  const requestsQuery = useQuery({
    queryKey: ["admin-requests"],
    queryFn: () => apiGet<FoodRequest[]>("/admin/requests"),
  });
  const donationsQuery = useQuery({
    queryKey: ["admin-donations"],
    queryFn: () => apiGet<Donation[]>("/admin/donations"),
  });
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiGet<User[]>("/admin/users"),
  });

  const stats = statsQuery.data;
  const requests = requestsQuery.data ?? [];
  const donations = donationsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      apiPost<FoodRequest>(`/admin/requests/${id}/${action}`),
    onSuccess: (r) => {
      toast.success(
        r.status === "approved"
          ? "Request approved — it is now on the volunteer pickup board"
          : "Request rejected",
      );
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const volunteerRuns = requests.filter((r) => r.volunteer_id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">
        Platform admin
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
          Mission control
        </h1>
        <BackupControls />
      </div>
      <p className="mt-2 text-sm text-[#475569]">
        Welcome{me?.name ? `, ${me.name}` : ""} — approve requests and keep an eye on every
        donation, volunteer and delivery.
      </p>

      {stats ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total users"
              value={stats.total_users}
              sub={`${stats.providers} donors · ${stats.recipients} NGOs · ${stats.volunteers} volunteers`}
              testId="kpi-total-users"
            />
            <KpiCard
              label="Surplus donations"
              value={stats.total_donations}
              sub={`${stats.available_donations} available · ${stats.completed_donations} delivered`}
              testId="kpi-total-donations"
            />
            <KpiCard
              label="Food requests"
              value={stats.total_requests}
              sub={`${stats.pending_requests} pending · ${stats.delivered_requests} delivered`}
              testId="kpi-total-requests"
            />
            <KpiCard
              label="Portions rescued"
              value={Math.round(stats.rescued_quantity)}
              sub="delivered to NGOs so far"
              testId="kpi-rescued"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card size="sm" className="border-[#e2e8f0] bg-white">
              <CardContent className="py-5">
                <h3 className="font-heading text-sm font-semibold text-[#0f172a]">
                  Listings by category
                </h3>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.category_counts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#475569" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#475569" }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Listings" fill="#047857" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card size="sm" className="border-[#e2e8f0] bg-white">
              <CardContent className="py-5">
                <h3 className="font-heading text-sm font-semibold text-[#0f172a]">
                  Listings by city
                </h3>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.city_counts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="city" tick={{ fontSize: 10, fill: "#475569" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#475569" }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Listings" fill="#d97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : statsQuery.isError ? (
        <p className="mt-8 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
          Platform stats are offline right now — tables below still refresh when the connection
          returns.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      )}

      <Tabs defaultValue="requests" className="mt-10">
        <TabsList>
          <TabsTrigger value="requests" data-testid="admin-tab-requests">
            Request review
          </TabsTrigger>
          <TabsTrigger value="donations" data-testid="admin-tab-donations">
            Donations
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-tab-users">
            Users
          </TabsTrigger>
          <TabsTrigger value="volunteers" data-testid="admin-tab-volunteers">
            Volunteer activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card size="sm" className="border-[#e2e8f0] bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Food</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-[#475569]">
                        No requests yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-stone-500">
                          {fmtDateTime(r.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-[#0f172a]">
                          {r.recipient_organization || r.recipient_name}
                        </TableCell>
                        <TableCell className="text-[#475569]">{r.donation_title}</TableCell>
                        <TableCell className="font-mono text-[#0f172a]">
                          {fmtQty(r.quantity, r.unit)}
                        </TableCell>
                        <TableCell>
                          <RequestStatusBadge status={r.status} testId={`admin-request-status-${r.id}`} />
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "pending" ? (
                            <span className="inline-flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => reviewMutation.mutate({ id: r.id, action: "approve" })}
                                disabled={reviewMutation.isPending}
                                data-testid={`btn-approve-${r.id}`}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 hover:bg-red-50"
                                onClick={() => reviewMutation.mutate({ id: r.id, action: "reject" })}
                                disabled={reviewMutation.isPending}
                                data-testid={`btn-reject-${r.id}`}
                              >
                                Reject
                              </Button>
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="mt-4">
          <Card size="sm" className="border-[#e2e8f0] bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Food</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-[#475569]">
                        No donations listed yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    donations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-[#0f172a]">{d.title}</TableCell>
                        <TableCell className="text-[#475569]">{d.provider_name}</TableCell>
                        <TableCell className="text-[#475569]">{d.city}</TableCell>
                        <TableCell className="font-mono text-[#0f172a]">
                          {fmtQty(d.quantity, d.unit)}
                        </TableCell>
                        <TableCell className="text-[#475569]">{fmtDate(d.expiry_date)}</TableCell>
                        <TableCell>
                          <DonationStatusBadge status={d.status} testId={`admin-donation-status-${d.id}`} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card size="sm" className="border-[#e2e8f0] bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-[#475569]">
                        No users yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-[#0f172a]">
                          {u.organization || u.name}
                        </TableCell>
                        <TableCell className="text-[#475569]">{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-[#e2e8f0] bg-[#f1f5f9] font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]"
                          >
                            {ROLE_LABEL[u.role] ?? u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#475569]">{u.city}</TableCell>
                        <TableCell className="font-mono text-xs text-[#475569]">{u.phone}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card size="sm" className="border-[#e2e8f0] bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Transport</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter((u) => u.role === "volunteer").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-[#475569]">
                          No volunteers registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users
                        .filter((u) => u.role === "volunteer")
                        .map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium text-[#0f172a]">{u.name}</TableCell>
                            <TableCell className="text-[#475569]">{u.city}</TableCell>
                            <TableCell className="text-[#475569]">{u.availability}</TableCell>
                            <TableCell className="text-[#475569]">{u.transportation}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card size="sm" className="border-[#e2e8f0] bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteerRuns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-[#475569]">
                          No volunteer runs yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      volunteerRuns.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-[#0f172a]">
                            {r.donation_title}
                          </TableCell>
                          <TableCell className="text-[#475569]">
                            <div className="font-semibold text-slate-900">{r.volunteer_name || "Unassigned"}</div>
                            {r.volunteer_phone && (
                              <a href={`tel:${r.volunteer_phone}`} className="text-xs text-emerald-600 hover:underline">
                                📞 {r.volunteer_phone}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <RequestStatusBadge
                              status={r.status as RequestStatus}
                              testId={`admin-run-status-${r.id}`}
                            />
                            {r.has_proof && (
                              <a
                                href={`/api/requests/${r.id}/proof`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 text-xs font-semibold text-[#059669] hover:underline"
                                data-testid={`admin-run-photo-${r.id}`}
                              >
                                Photo
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-stone-500">
                            {fmtDateTime(r.updated_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
