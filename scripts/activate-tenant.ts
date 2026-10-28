// Registra el pago de un taller: pnpm tenant:activate <slug> [meses=1]
import "dotenv/config";
import { activateTenant } from "../src/lib/access";

async function main() {
  const [slug, monthsArg = "1"] = process.argv.slice(2);
  if (!slug) {
    console.error("Uso: pnpm tenant:activate <slug> [meses]");
    process.exit(1);
  }
  const t = await activateTenant(slug, Number(monthsArg));
  console.log(`${t.name} (${t.slug}) activo hasta ${t.paidUntil?.toISOString().slice(0, 10)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
