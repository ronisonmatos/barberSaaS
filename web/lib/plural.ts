/** Escolhe a forma singular ou plural conforme n. Ex: plural(1, "profissional", "profissionais") -> "profissional". */
export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}
