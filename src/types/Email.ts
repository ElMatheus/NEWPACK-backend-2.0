export type SendEmailType = {
  numero_pedido: number;
  apelido_cliente: string;
  id_cliente: string;
  nome_cliente: string;
  id_pedido: string;
  data_pedido: string;
  status_pedido: string;
  descricao_pedido: string | null;
  preco_total_pedido: string;
  parcelas_pedido: number;
  valor_parcelas_pedido: string;
  infosAddress: {
    cep: string;
    street: string;
    number: number;
    city: string;
    state: string;
    neighborhood: string | null;
    complement: string | null;
    freight: string;
  };
  products: {
    id: number;
    name: string;
    toughness: string | null;
    dimension: string | null;
    description: string | null;
    type: string;
    category: string;
    quantity: number;
    unit_quantity: number | null;
    unit_value: number;
    full_price: string;
  }[];
  infosClient: {
    name: string;
    telephone: string;
  };
  hasNotification: boolean;
};

export type SendConfirmationEmailType = {
  order_id: string;
  client_name: string;
  client_email: string;
}