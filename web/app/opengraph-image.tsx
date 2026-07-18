import { ImageResponse } from "next/og";

export const alt = "Comptus — agendamento online para barbearias e salões de beleza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARVAO = "#17191C";
const MARFIM = "#F4F2ED";
const LATAO = "#C9A15C";
const CINZA = "#B9B3A8";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: CARVAO,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 64, height: 6, background: LATAO, borderRadius: 3, display: "flex" }} />
            <div style={{ width: 32, height: 6, background: LATAO, borderRadius: 3, display: "flex" }} />
          </div>
          <div style={{ display: "flex", fontSize: 96, color: MARFIM, fontWeight: 700, letterSpacing: -2 }}>
            Comptus
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: CINZA, maxWidth: 900 }}>
          Agendamento online para barbearias e salões de beleza
        </div>
      </div>
    ),
    { ...size }
  );
}
