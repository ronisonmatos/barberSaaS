export function papelLabel(papel: "owner" | "staff", genero: "masculino" | "feminino" | null) {
  if (papel === "staff") return "Equipe";
  return genero === "feminino" ? "Dona" : "Dono";
}
