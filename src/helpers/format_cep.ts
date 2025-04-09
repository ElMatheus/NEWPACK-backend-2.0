export const formatCEP = (cep: number): string => {
  // Convert the number to a string
  const cepString = cep.toString();

  // Format the string to match the CEP format (XXXXX-XXX)
  const formattedCEP = `${cepString.slice(0, 5)}-${cepString.slice(5)}`;

  return formattedCEP;
}