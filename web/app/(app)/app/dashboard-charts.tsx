"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { plural } from "@/lib/plural";
import { Heading } from "@/components/ui/heading";

type BarraStatus = { rotulo: string; valor: number; cor: string };
type PontoDia = { rotulo: string; valor: number };

function TooltipBarra({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: BarraStatus }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border border-linha bg-marfim-2 px-3 py-2 text-sm shadow-[0_1px_2px_rgb(0_0_0_/_0.06)]">
      <p className="font-medium text-carvao">{item.valor}</p>
      <p className="text-cinza-600">{item.rotulo}</p>
    </div>
  );
}

function TooltipDia({ active, payload }: { active?: boolean; payload?: { payload: PontoDia }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border border-linha bg-marfim-2 px-3 py-2 text-sm shadow-[0_1px_2px_rgb(0_0_0_/_0.06)]">
      <p className="font-medium text-carvao">
        {item.valor} {plural(item.valor, "agendamento", "agendamentos")}
      </p>
      <p className="text-cinza-600">{item.rotulo}</p>
    </div>
  );
}

export function GraficoStatus({ dados }: { dados: BarraStatus[] }) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <Heading as="h2">Agendamentos por status</Heading>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--linha)" />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={{ stroke: "var(--linha)" }}
              tick={{ fill: "var(--cinza-600)", fontSize: 13.5 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--cinza-600)", fontSize: 13.5 }}
              width={28}
            />
            <Tooltip content={<TooltipBarra />} cursor={{ fill: "var(--marfim)" }} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {dados.map((item) => (
                <Cell key={item.rotulo} fill={item.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function GraficoVolumeDiario({ dados }: { dados: PontoDia[] }) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <Heading as="h2">Volume por dia</Heading>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--linha)" />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={{ stroke: "var(--linha)" }}
              tick={{ fill: "var(--cinza-600)", fontSize: 13.5 }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--cinza-600)", fontSize: 13.5 }}
              width={28}
            />
            <Tooltip content={<TooltipDia />} cursor={{ stroke: "var(--linha-escuro)" }} />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="var(--latao-escuro)"
              strokeWidth={2}
              fill="var(--latao-escuro)"
              fillOpacity={0.1}
              activeDot={{ r: 4, fill: "var(--latao-escuro)", stroke: "var(--marfim-2)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
