export function papelLabel(papel: "owner" | "staff", genero: "masculino" | "feminino" | null) {
  if (papel === "staff") return "Equipe";
  if (genero === "feminino") return "Dona";
  if (genero === "masculino") return "Dono";
  return "Responsável";
}
