import { Shell } from "./shared/shell";

export default function Home() {
  return (
    <Shell active="dashboard">
      <h2>Dashboard</h2>
      <p>Bem-vindo ao sistema de controle de produção.</p>
    </Shell>
  );
}