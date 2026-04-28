// Augmentation manual enquanto o types.ts gerado não inclui stock_item_id
// em consumption_items. Quando a plataforma regenerar o arquivo, este pode ser removido.
import "./types";

declare module "./types" {
  interface Database {
    public: {
      Tables: {
        consumption_items: {
          Row: {
            stock_item_id: string | null;
          };
          Insert: {
            stock_item_id?: string | null;
          };
          Update: {
            stock_item_id?: string | null;
          };
        };
      };
    };
  }
}
