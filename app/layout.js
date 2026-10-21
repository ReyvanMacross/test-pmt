import "./globals.css";

export const metadata = {
  title: {
    default: "Portal Multi-Tenant Kecamatan — Pemerintah Kota Bandung",
    template: "%s | Portal Kecamatan Kota Bandung",
  },
  description: "Portal resmi kecamatan di lingkungan Pemerintah Kota Bandung.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
