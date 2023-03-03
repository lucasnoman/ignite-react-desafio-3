import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // TODO - ✅
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) return JSON.parse(storagedCart);

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO - ✅
      const productToBeAdded = await api
        .get<Product>(`products/${productId}`)
        .then((response) => ({
          ...response.data,
          amount: 1,
        }));

      const stock = await api
        .get<Stock>(`stock/${productId}`)
        .then((response) => response.data);

      if (cart.length === 0) {
        setCart([productToBeAdded]);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(Array(productToBeAdded))
        );
      } else {
        const cartAlreadyHasProduct = cart.some(
          (item) => productId === item.id
        );

        if (cartAlreadyHasProduct) {
          const productIncrement = cart.map((cart) => {
            if (cart.id === productId && cart.amount === stock.amount) {
              throw toast.error('Quantidade solicitada fora de estoque');
            } else if (cart.id === productId) {
              cart.amount += 1;
            }

            return cart;
          });
          setCart(productIncrement);

          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify(productIncrement)
          );
        } else {
          setCart((old) => [...old, productToBeAdded]);

          const newCart = [...cart, productToBeAdded];
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      // TODO - ✅
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO - ✅
      const hasProductOnCart = cart.some((item) => productId === item.id);
      if (!hasProductOnCart) throw toast.error('Erro na remoção do produto');

      const newCart = cart.filter((product) => product.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      // TODO - ✅
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO - ✅
      if (amount <= 0) return;

      const stock = await api
        .get<Stock>(`stock/${productId}`)
        .then((response) => response.data);

      const newCart = cart.map((cart) => {
        if (cart.id === productId && amount < stock.amount) {
          cart.amount = amount;
        } else if (cart.id === productId) {
          throw toast.error('Quantidade solicitada fora de estoque');
        }
        return cart;
      });

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      // TODO - ✅
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
