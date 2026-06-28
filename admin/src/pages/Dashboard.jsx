import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getDashboard } from "../api/analytics";
import { TrendingUp, ShoppingBag, Sparkles, Users, Award, Percent, Eye } from "lucide-react";

const STATS = [
  { label: "Gross Revenue", key: "revenue", icon: TrendingUp, suffix: " د.ع" },
  { label: "Total Orders", key: "orders", icon: ShoppingBag },
  { label: "AI Try-On Inferences", key: "tryon", icon: Sparkles },
  { label: "Unique Views", key: "views", icon: Users },
];

const EXTRA_STATS = [
  { label: "Try-On Conv. Rate", val: "24.8%", icon: Percent, desc: "Try-on to Add-to-Bag ratio" },
  { label: "Drape Engagement", val: "88.2/100", icon: Award, desc: "Interaction time on Fitting Room" },
];

const TOP_GARMENTS = [
  { rank: 1, name: "Mini Silk Slip Dress", brand: "Gucci", tryons: 842, conv: "32.4%" },
  { rank: 2, name: "Slim Fit Chinos", brand: "Zara", tryons: 620, conv: "28.1%" },
  { rank: 3, name: "Leather Biker Jacket", brand: "Gucci", tryons: 590, conv: "25.6%" },
  { rank: 4, name: "Air Max Sneakers", brand: "Nike", tryons: 412, conv: "18.3%" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-4 text-xs shadow-lg">
      <p className="text-gray-500 mb-2 font-semibold tracking-widest uppercase">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-sm text-black">
          {p.name}: {p.name === "Revenue" ? `${p.value.toLocaleString()} د.ع` : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const totals = data.reduce(
    (acc, d) => ({
      revenue: acc.revenue + (d.revenue || 0),
      orders: acc.orders + (d.orders || 0),
      tryon: acc.tryon + (d.tryon || 0),
      views: acc.views + (d.views || 0),
    }),
    { revenue: 0, orders: 0, tryon: 0, views: 0 }
  );

  return (
    <div className="p-10 font-sans max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="heading-serif text-4xl mb-2 text-black font-light">Command Center</h1>
        <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Performance Metrics — Last 30 Days</p>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map(({ label, key, icon: Icon, suffix = "" }) => (
          <div key={key} className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 text-gray-400">
              <Icon size={16} />
              <p className="text-xs font-bold tracking-widest uppercase">{label}</p>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-light text-black">
                {totals[key].toLocaleString()}
                {suffix}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Try-On Intelligence Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {EXTRA_STATS.map(({ label, val, icon: Icon, desc }) => (
          <div key={label} className="bg-gradient-to-r from-neutral-50 to-white border border-gray-200 p-6 rounded-sm shadow-sm flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-400">
                <Icon size={16} className="text-black" />
                <p className="text-xs font-bold tracking-widest uppercase text-black">{label}</p>
              </div>
              <p className="text-3xl font-light text-black">{val}</p>
              <p className="text-[10px] text-gray-400">{desc}</p>
            </div>
            <Sparkles size={28} className="text-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}K د.ع` : `${val} د.ع`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#000000" fill="url(#revGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders + TryOn */}
        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6">Engagement Activity</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#000000" radius={[2, 2, 0, 0]} />
              <Bar dataKey="tryon" name="Try-Ons" fill="#D1D5DB" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aesthetic Preference Demand Distribution Chart */}
      <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6">Aesthetic Demand Distribution (Styles Curation)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            layout="vertical"
            data={[
              { name: "Stealth Wealth", tryons: 1420, checkouts: 460 },
              { name: "Minimal Elegance", tryons: 1100, checkouts: 310 },
              { name: "Cozy Minimalism", tryons: 950, checkouts: 265 },
              { name: "Avant-Garde", tryons: 880, checkouts: 225 },
              { name: "Evening Elegance", tryons: 740, checkouts: 190 },
            ]}
            margin={{ left: 20, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#000000", fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tryons" name="Atelier Try-Ons" fill="#E5E4DE" radius={[0, 2, 2, 0]} barSize={10} />
            <Bar dataKey="checkouts" name="Orders" fill="#000000" radius={[0, 2, 2, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>


      {/* Top Garments Conversion Table */}
      <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
        <div className="flex justify-between items-baseline mb-6 border-b pb-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500">
            Top Performing Garments by Try-On Conversion
          </h2>
          <span className="text-[10px] text-gray-400">Total metrics aggregated dynamically</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500 border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Rank</th>
                <th className="py-3 px-4 font-bold">Garment Item</th>
                <th className="py-3 px-4 font-bold">Boutique House</th>
                <th className="py-3 px-4 font-bold text-center">Try-On count</th>
                <th className="py-3 px-4 font-bold text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {TOP_GARMENTS.map((g) => (
                <tr key={g.rank} className="border-b border-gray-100 last:border-0 hover:bg-neutral-50 text-black">
                  <td className="py-3 px-4 font-bold text-gray-400">#0{g.rank}</td>
                  <td className="py-3 px-4 font-medium">{g.name}</td>
                  <td className="py-3 px-4 font-light text-gray-500">{g.brand}</td>
                  <td className="py-3 px-4 text-center font-light">{g.tryons.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">{g.conv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Trend Insights & Staged Predictions */}
      <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
        <div className="flex justify-between items-baseline mb-6 border-b pb-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500">
            Brand Staging & Demand Prediction Insights
          </h2>
          <span className="text-[10px] text-gray-400">Powered by Vrital Predictive AI</span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-100 rounded-sm bg-neutral-50 space-y-2">
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Styling Correlation</span>
            <h4 className="text-xs font-bold text-black">Look Builder Affinity</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-light">
              Combining the <strong className="font-semibold text-black">Mini Silk Slip Dress</strong> with the <strong className="font-semibold text-black">Leather Biker Jacket</strong> is tried 42% more often than individual items, creating a cross-sell conversion lift of +18%.
            </p>
          </div>
          <div className="p-4 border border-gray-100 rounded-sm bg-neutral-50 space-y-2">
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Demand Prediction</span>
            <h4 className="text-xs font-bold text-black">Aesthetic Trend Lift</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-light">
              Interest in <strong className="font-semibold text-black">Stealth Wealth</strong> aesthetics (e.g. linen trousers, silk slip dresses) is predicted to rise 18% in search volume over the next quarter as seasonal collections transition.
            </p>
          </div>
          <div className="p-4 border border-gray-100 rounded-sm bg-neutral-50 space-y-2">
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Recommended Action</span>
            <h4 className="text-xs font-bold text-black">Fitting Funnel Optimization</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-light">
              The Floral Maxi Dress has a high try-on rate (840+) but lower checkout conversion. Recommended Action: Add detailed fabric weight and drape annotations to increase shopper fit certainty.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
